import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default function DonatePage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4 text-center">
            Support the Project
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            If you find this project helpful, consider buying me a coffee or
            making a small donation! Your support helps keep the project alive
            and free for everyone.
          </p>
          <a
            href="https://www.buymeacoffee.com/yourusername" // Replace with your actual donation link
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 text-lg rounded-lg shadow">
              ☕ Buy Me a Coffee
            </Button>
          </a>
        </div>
      </main>
    </>
  );
}
