import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import {
  ArrowUpRight,
  CheckCircle2,
  Zap,
  Shield,
  Users,
  FileText,
  Download,
  Globe,
  Clock,
} from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans"
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Unlock Powerful YouTube Productivity Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore AI-powered tools to summarize, organize, and manage your
              YouTube content. NovaAI helps creators, educators, and marketers
              boost their workflow and creativity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: "AI Summarization",
                description:
                  "Summarize videos, transcripts, and comments with advanced AI.",
              },
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Multiple Formats",
                description:
                  "Export insights, summaries, and transcripts in various formats.",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Instant Results",
                description:
                  "Get your YouTube data and insights in seconds, not minutes.",
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Global Support",
                description:
                  "Works with YouTube videos worldwide, any language, any device.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-red-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get started with NovaAI in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Paste YouTube URLs</h3>
              <p className="text-gray-600">
                Add one or multiple YouTube video URLs to get started with any
                tool
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Choose a Tool</h3>
              <p className="text-gray-600">
                Select from summarization, transcript, analytics, and more
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Results</h3>
              <p className="text-gray-600">
                Instantly receive insights, downloads, and productivity boosts
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-red-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-red-100">Transcripts Downloaded</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-red-100">Happy Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-red-100">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade when you need more. No hidden fees, cancel
              anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Boost Your YouTube Productivity?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join creators, educators, and professionals using NovaAI to
            supercharge their YouTube workflow.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-8 py-4 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
          >
            Explore Tools Free
            <Download className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
