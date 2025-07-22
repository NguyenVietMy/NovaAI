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
              All-in-One YouTube Productivity Toolkit
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              NovaAI empowers creators and students to get more from YouTube:
              instantly generate transcripts, AI-powered summaries, brainstorm
              video ideas, and outline content—all in one place. No signup
              required for basic use.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <FileText className="w-6 h-6" />,
                title: "Transcript + AI Summary",
                description:
                  "Extract YouTube transcripts and get concise AI-generated summaries for any video.",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Video Outliner",
                description:
                  "Turn long videos into structured outlines for easier review, study, or content repurposing.",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Ideas Brainstormer",
                description:
                  "Generate fresh video ideas and creative prompts tailored to your channel or topic.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Privacy-First",
                description:
                  "Your data is never stored without your consent. Use core features without an account.",
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

      {/* What Makes NovaAI Different Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">
              What Makes NovaAI Different?
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              NovaAI stands out from other YouTube tools with a unique blend of
              speed, privacy, and AI-powered features.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Built for Speed",
                description:
                  "Get results in seconds, not minutes. NovaAI is optimized for instant feedback and productivity.",
              },
              {
                title: "No Signup Required",
                description:
                  "Access core features without creating an account. Start using NovaAI right away.",
              },
              {
                title: "AI-Powered Insights",
                description:
                  "Harness the latest AI models to summarize, outline, and brainstorm with accuracy and creativity.",
              },
              {
                title: "Open-Source Core",
                description:
                  "NovaAI is built on open technologies and welcomes community contributions.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <h4 className="text-lg font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-600">{item.description}</p>
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
              <h3 className="text-xl font-semibold mb-2">
                Paste a YouTube URL
              </h3>
              <p className="text-gray-600">
                Add a YouTube video link to get started with any tool—no signup
                needed
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pick a Feature</h3>
              <p className="text-gray-600">
                Choose transcript+summary, video outliner, or
                brainstormer—tailored for creators and students
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-red-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Get Instant Results
              </h3>
              <p className="text-gray-600">
                Instantly receive transcripts, summaries, outlines, or
                ideas—ready to use or download
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
      {/* <section className="py-24 bg-white" id="pricing">
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
      </section> */}

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Boost Your YouTube Workflow?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join creators and students using NovaAI to supercharge their YouTube
            learning and content creation.
          </p>
          <a
            href="/tools"
            className="inline-flex items-center px-8 py-4 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
          >
            Explore All Tools
            <Download className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Tech Stack Badge */}
      <div className="w-full flex justify-center py-4 bg-white border-t border-gray-100">
        <span className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gray-50 text-gray-500 text-sm font-medium shadow-sm">
          <span>Powered by</span>
          <span className="font-semibold text-gray-700">Supabase</span>
          <span className="font-semibold text-gray-700">Stripe</span>
          <span className="font-semibold text-gray-700">OpenAI</span>
          <span className="font-semibold text-gray-700">Next.js</span>
          <span className="font-semibold text-gray-700">Tailwind</span>
        </span>
      </div>

      <Footer />
    </div>
  );
}
