import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request) {
    try {
        const { userId, has } = getAuth(request);
        if (!userId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const { addressId, items, couponCode, paymentMethod } = await request.json();
        
        // Check if all required fields are present
        if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "missing order details" }, { status: 400 });
        }

        let coupon = null;

        // FIX 1: The entire coupon validation logic is now inside this single block.
        // It only runs if a couponCode was actually provided.
        if (couponCode && typeof couponCode === 'string' && couponCode.trim() !== '') {
            coupon = await prisma.coupon.findUnique({
                where: {
                    code: couponCode.toUpperCase()
                }
            });

            // FIX 2: This check now correctly runs ONLY if a code was provided but not found/expired.
            if (!coupon || new Date(coupon.expiresAt) < new Date()) {
                return NextResponse.json({ error: "Coupon not found or has expired" }, { status: 404 });
            }

            // FIX 3: All other coupon-related checks are moved inside this block.
            // This prevents "Cannot read property of null" errors when no coupon is used.
            if (coupon.forNewUser) {
                if (!userId) {
                    return NextResponse.json({ error: "You must be logged in to use this coupon." }, { status: 401 });
                }
                const userorders = await prisma.order.findMany({ where: { userId } });
                if (userorders.length > 0) {
                    return NextResponse.json({ error: "Coupon valid for new users only" }, { status: 400 });
                }
            }

            const isPlusMember = has({ plan: 'plus' });
            if (coupon.forMember) {
                if (!isPlusMember) {
                    return NextResponse.json({ error: "Coupon valid for Plus members only" }, { status: 400 });
                }
            }
        }

        // Group orders by storeId using a map
        const ordersByStore = new Map();
        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } });
            const storeId = product.storeId;
            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, []);
            }
            ordersByStore.get(storeId).push({ ...item, price: product.price });
        }

        let orderIds = [];
        let fullAmount = 0;
        let isShippingFeeAdded = false;

        // Create order for each seller
        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            
            // FIX 4: Apply discount based on the validated `coupon` object, not the initial `couponCode` string.
            if (coupon) {
                total -= (total * coupon.discount) / 100;
            }

            const isPlusMember = has({ plan: 'plus' }); // Recalculating here as per original code
            if (!isPlusMember && !isShippingFeeAdded) {
                total += 5; // flat shipping fee
                isShippingFeeAdded = true;
            }

            fullAmount += parseFloat(total.toFixed(2));

            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    total: parseFloat(total.toFixed(2)),
                    paymentMethod,
                    isCouponUsed: coupon ? true : false,
                    coupon: coupon ? coupon : {},
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            });
            orderIds.push(order.id);
        }

        if (paymentMethod==='STRIPE') {
            const stripe =Stripe(process.env.STRIPE_SECRET_KEY);
            const origin = await request.headers.get('origin');
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Order'
                        },
                        unit_amount:Math.round(fullAmount * 100)

                    },
                    quantity: 1
                }],
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60, //current timr+30 mins
                mode: 'payment', 
                success_url:`${origin}/loading?nextUrl=orders`,
                cancel_url:`${origin}/cart`,
                metadata : {
                    orderIds: orderIds.join(','),
                    userId,
                    appId: 'gocart'
                }
            });
            return NextResponse.json({ session }, { status: 200 });
        }

        // Clear the cart
        await prisma.user.update({
            where: { id: userId },
            data: {
                cart: {}
            }
        });

        return NextResponse.json({ message: "Order placed successfully" }, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// get all orders for user
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const orders = await prisma.order.findMany({
            where: {
                userId,
                OR: [
                    { paymentMethod: PaymentMethod.COD },
                    { AND: [{ paymentMethod: PaymentMethod.STRIPE }, { isPaid: true }] }
                ]
            },
            include: {
                orderItems: { include: { product: true } },
                address: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ orders }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}