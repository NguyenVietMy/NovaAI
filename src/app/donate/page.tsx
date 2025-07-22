import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function DonatePage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-16 flex flex-col items-center">
          <h1 className="text-5xl font-bold mb-8 text-center">
            Support the Project
          </h1>
          <p className="text-gray-600 mb-10 text-center text-xl">
            If you find this project helpful, consider making a donation via
            MoMo! Your support helps keep the project alive and free for
            everyone.
          </p>

          {/* MoMo QR Code */}
          <div className="mb-10 flex flex-col items-center">
            <div className="bg-white p-8 rounded-lg shadow-md mb-8">
              <Image
                src="/DonateMe_momo.jpg"
                alt="MoMo QR Code for donations"
                width={450}
                height={450}
                className="rounded-lg"
              />
            </div>
            <p className="text-lg text-gray-500 text-center">
              Scan the QR code with MoMo app to donate
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
