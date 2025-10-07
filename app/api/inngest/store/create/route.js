import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// create the store


export async function POST(request){
    try {

        const { userId } = getAuth(request);
        //Get the data from the form
        const formData = await request.formData();
        const name = formData.get("name");
        const username = formData.get("username");
        const description = formData.get("description");
        const email = formData.get("email");
       
        const contact = formData.get("contact");
        const address = formData.get("address");
    
        const image = formData.get("image");

        if(!name || !username || !description || !email || !contact || !address || !image){
            return NextResponse.json({error: "missing store info"}, {status: 400});
        }

        // check if user has already registered a store

        const store = await prisma.store.findFirst({
            where: {userId: userId}
        })

        // if store is already registered, update status of store

        if(store){
            return NextResponse.json({status: store.status})
        }

        // check if username is taken 

        const isUsernameTaken= await prisma.store.findFirst({
            where:{username: username.toLowerCase()}
        })

        if(isUsernameTaken){
            return NextResponse.json({error: "Username already taken"},{status:400})
        }
        
        
    } catch (error) {
        
    }
}