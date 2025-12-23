import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { findUserByEmail, storeChallenge } from '@/lib/auth/db';
import crypto from 'crypto';

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // If email is provided, get user's passkeys for allowCredentials
    let allowCredentials: { id: string; transports?: ('usb' | 'nfc' | 'ble' | 'internal' | 'hybrid')[] }[] | undefined;

    if (email) {
      const user = await findUserByEmail(email);

      if (!user || !user.passkeys?.length) {
        return NextResponse.json(
          { success: false, message: 'No passkeys found for this account' },
          { status: 404 }
        );
      }

      allowCredentials = user.passkeys.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports as ('usb' | 'nfc' | 'ble' | 'internal' | 'hybrid')[],
      }));
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: 'preferred',
      timeout: 60000,
    });

    // Store challenge for verification
    const challengeId = crypto.randomUUID();
    await storeChallenge(challengeId, options.challenge);

    return NextResponse.json({
      success: true,
      options,
      challengeId,
    });
  } catch (error) {
    console.error('Error generating passkey login options:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate login options' },
      { status: 500 }
    );
  }
}
