// File: app/api/stripe/route.js

import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
    try {
        const body = await request.text();
        const sig = request.headers.get('stripe-signature');

        let event;

        // Verify the webhook signature to ensure the request is from Stripe
        try {
            event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
        }

        // --- FIX 1: Listen for the correct event: 'checkout.session.completed' ---
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // Fulfill the order only if the payment was successful
            if (session.payment_status === 'paid') {
                const { orderIds, userId, appId } = session.metadata;

                // Validate appID if you use it for security
                if (appId !== 'gocart') {
                    console.log('Webhook received for an invalid app id');
                    return NextResponse.json({ received: true, message: 'Invalid app id' });
                }

                if (!orderIds || !userId) {
                    console.error('Webhook received without required metadata (orderIds or userId)');
                    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
                }

                const orderIdsArray = orderIds.split(',');

                // --- FIX 2: Use `updateMany` for an efficient database update ---
                // Mark all related orders as paid in a single database call
                await prisma.order.updateMany({
                    where: { 
                        id: { in: orderIdsArray },
                        userId: userId, // Security check to ensure orders belong to the user
                    },
                    data: { isPaid: true }
                });

                // --- FIX 3: Clear the user's cart from the User model ---
                // This logic was correct but likely never reached before.
                await prisma.user.update({
                    where: { id: userId },
                    data: { 
                        cart: {} // Set the cart JSON field to an empty object
                    }
                });
                
                console.log(`Successfully processed payment and cleared cart for user: ${userId}`);
            }
        } else {
            console.log(`Unhandled event type received: ${event.type}`);
        }

        // Acknowledge receipt of the event
        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        console.error(`Error in Stripe webhook handler: ${error.message}`);
        // Return a 500 status to let Stripe know something went wrong on our end
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// The 'config' object is for the Pages Router and is not needed in the App Router.
// You can safely remove it.
// export const config = {
//     api: { bodyParser: false }
// }