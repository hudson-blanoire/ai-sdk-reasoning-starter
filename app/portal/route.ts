import { CustomerPortal } from "@polar-sh/nextjs";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export const GET = CustomerPortal({
	accessToken: process.env.POLAR_ACCESS_TOKEN!,
	getCustomerId: async (req: NextRequest) => {
		console.log("Accessing /portal route");
		const { userId, user } = auth();
		
		if (!userId) {
			console.error("Polar Portal Error: User not authenticated.");
			return "";
		}

		const email = user?.primaryEmailAddress?.emailAddress;
		console.log(`Polar Portal: Attempting lookup for userId: ${userId}, email: ${email}`);

		if (!email) {
			console.error(`Polar Portal Error: Email address missing for user ${userId}.`);
			return "";
		}

		return email;
	},
});
