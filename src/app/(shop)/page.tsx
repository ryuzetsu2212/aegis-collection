'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  Cpu,
  Layers,
  Zap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Code2,
  Bot,
  Shirt,
  Eye,
  TrendingUp,
  Search,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Sliders,
  Send,
  Loader2,
  CheckCircle,
  Building,
  Lock,
  Globe2
} from 'lucide-react'

// Demo garments data
const PRESET_GARMENTS = [
  {
    id: 'trench',
    name: 'Tailored Italian Wool Overcoat',
    category: 'Outerwear',
    specs: 'Double-breasted, 100% Virgin Wool, Peak lapel, Camel finish',
    imageUrl: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=800&auto=format&fit=crop',
    actions: {
      merchandising: {
        title: 'The Milano Double-Breasted Virgin Wool Overcoat in Heritage Camel',
        editorial: 'Masterfully structured from heavyweight Italian virgin wool, this double-breasted overcoat pairs sartorial discipline with effortless drape. Engineered with commanding peak lapels and horn buttons for seamless transition from boardroom to evening gallery receptions.',
        tags: ['Heritage Sartorial', 'Virgin Wool', 'Camel Tone', 'AW26 Formal', 'Architectural Silhouette'],
        confidence: '99.8%',
        seoScore: '98/100',
      },
      styling: {
        lookName: 'Milanese Autumn Metropolitan',
        palette: ['#C4A482 (Camel)', '#1A1A1A (Charcoal)', '#F5F5F0 (Ecru)'],
        recommendedPairs: [
          'Cashmere Rollneck Sweater in Off-White',
          'Pleated Flannel Trousers in Charcoal Melange',
          'Blake-Stitched Leather Chelsea Boots in Espresso'
        ],
        rationale: 'The camel overcoat provides substantial visual weight; paired with ecru knitwear softens the neckline while charcoal trousers anchor the lower silhouette.'
      },
      trends: {
        sentiment: 'High Positive (+34% WoW search velocity)',
        seasonFit: 'Autumn / Winter 2026-2027',
        targetAudience: 'Urban professionals aged 26-44 seeking timeless quiet luxury investment pieces.',
        velocityIndex: '9.4 / 10'
      }
    }
  },
  {
    id: 'dress',
    name: 'Asymmetric Silk Crepe Midi Slip',
    category: 'Eveningwear',
    specs: 'Bias-cut 22mm Mulberry Silk, Asymmetric hemline, Liquid drape, Emerald hue',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
    actions: {
      merchandising: {
        title: 'The Eos Asymmetric Mulberry Silk Crepe Slip Dress in Deep Emerald',
        editorial: 'Cut on the bias to trace the natural contours of the body, the Eos Slip Dress is rendered in liquid 22mm Mulberry silk. Features a subtle cowl neckline and an architectural asymmetric hemline that catches ambient candlelight with subtle luster.',
        tags: ['Bias Cut', 'Mulberry Silk', 'Emerald Green', 'Contemporary Gala', 'Liquid Drape'],
        confidence: '99.5%',
        seoScore: '96/100',
      },
      styling: {
        lookName: 'Midnight Gallery Vernissage',
        palette: ['#0A3828 (Deep Emerald)', '#D4AF37 (Pale Gold)', '#000000 (Onyx)'],
        recommendedPairs: [
          'Minimalist Strappy Heeled Sandals in Mirrored Gold',
          'Structured Velvet Tuxedo Blazer in Jet Black',
          'Architectural Freshwater Pearl Drop Earrings'
        ],
        rationale: 'Deep jewel tones harmonize with tactile black velvet, providing temperature balance and tactile contrast to the high-sheen silk.'
      },
      trends: {
        sentiment: 'Sustained High Growth (+41% demand on eveningwear)',
        seasonFit: 'Holiday 2026 & Spring Gala Season',
        targetAudience: 'Cocktail attendees, black-tie wedding guests, and luxury evening shoppers.',
        velocityIndex: '9.7 / 10'
      }
    }
  },
  {
    id: 'denim',
    name: 'Raw Japanese Selvedge Trucker',
    category: 'Denim & Casual',
    specs: '14.5oz Kurabo Mills Raw Denim, Copper rivets, Boxy box-pleat fit, Indigo',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?q=80&w=800&auto=format&fit=crop',
    actions: {
      merchandising: {
        title: 'Type-II Raw Indigo Selvedge Denim Trucker Jacket (14.5oz Kurabo Mills)',
        editorial: 'Woven on vintage Toyoda shuttle looms in Kojima, Okayama, this trucker jacket features unwashed 14.5oz red-line selvedge denim. Built with front knife pleats, solid custom copper hardware, and destined to develop unique high-contrast fades over years of authentic wear.',
        tags: ['Raw Selvedge', 'Kojima Crafted', '14.5oz Denim', 'Workwear Heritage', 'Indigo Aging'],
        confidence: '99.9%',
        seoScore: '99/100',
      },
      styling: {
        lookName: 'Authentic Heritage Tokyo Minimalist',
        palette: ['#1B2F4C (Raw Indigo)', '#F2EBD9 (Heavy Canvas)', '#543D2B (Waxed Brown)'],
        recommendedPairs: [
          'Heavyweight 280gsm Loopwheel Pocket Tee in Ecru',
          'Relaxed Chino Fatigue Pants in Washed Olive',
          'Waxed Roughout Leather Service Boots'
        ],
        rationale: 'Raw indigo requires sturdy, tactile companions. Heavyweight ecru jersey and olive twill prevent color bleed friction while grounding the utility aesthetic.'
      },
      trends: {
        sentiment: 'Perennial Cult Classic (+18% vintage enthusiast engagement)',
        seasonFit: 'All-Year Transitional Staple',
        targetAudience: 'Artisanal menswear enthusiasts, heritage denim collectors, craft-conscious shoppers.',
        velocityIndex: '8.9 / 10'
      }
    }
  }
]

export default function AegisLandingPage() {
  const [selectedGarment, setSelectedGarment] = useState(PRESET_GARMENTS[0])
  const [activeTab, setActiveTab] = useState<'merchandising' | 'styling' | 'trends'>('merchandising')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [codeLang, setCodeLang] = useState<'curl' | 'typescript' | 'python'>('typescript')

  // Early access form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    skuVolume: '1,000 - 10,000 SKUs'
  })
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const handleSimulateAnalysis = (garment: typeof PRESET_GARMENTS[0], tab: 'merchandising' | 'styling' | 'trends') => {
    setIsGenerating(true)
    setSelectedGarment(garment)
    setActiveTab(tab)
    setTimeout(() => {
      setIsGenerating(false)
    }, 450)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setTimeout(() => {
      setFormLoading(false)
      setFormSubmitted(true)
    }, 700)
  }

  const codeSnippets = {
    typescript: `import { AegisClient } from '@aegis-ai/sdk'

const aegis = new AegisClient({
  apiKey: process.env.AEGIS_API_KEY,
  model: 'aegis-claude-3-5-sonnet-fashion-v2'
})

// Autonomous Multi-Modal Merchandising & Style Enrichment
const response = await aegis.merchandise.enrich({
  imageUrl: 'https://cdn.yourbrand.com/products/overcoat-camel-aw26.jpg',
  brandVoice: 'Minimalist Milanese Luxury',
  specs: {
    material: '100% Virgin Wool',
    silhouette: 'Double Breasted',
    category: 'Outerwear'
  },
  generate: ['editorial_copy', 'style_graph', 'seo_metadata', 'trend_velocity']
})

console.log(response.editorialTitle)
// -> "The Milano Double-Breasted Virgin Wool Overcoat in Heritage Camel"
console.log(response.styleGraph.recommendedPairs)
// -> ["Cashmere Rollneck Sweater", "Pleated Flannel Trousers", ...]`,

    python: `from aegis_ai import AegisClient

client = AegisClient(api_key="aegis_sec_live_99214")

# Synthesize multi-modal garment styling and attributes
enrichment = client.merchandise.enrich(
    image_url="https://cdn.yourbrand.com/products/overcoat-camel-aw26.jpg",
    brand_voice="Minimalist Milanese Luxury",
    specs={
        "material": "100% Virgin Wool",
        "silhouette": "Double Breasted"
    },
    capabilities=["editorial_copy", "look_synthesis", "trend_fit"]
)

print(enrichment.editorial_title)
print(enrichment.suggested_look.palette)`,

    curl: `curl -X POST https://api.aegiscollection.biz.id/v1/merchandise/enrich \
  -H "Authorization: Bearer YOUR_AEGIS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "aegis-claude-3-5-sonnet-fashion",
    "image_url": "https://cdn.yourbrand.com/products/overcoat-camel.jpg",
    "brand_voice": "Contemporary Minimalist",
    "capabilities": ["editorial_copy", "style_graph", "seo_schema"]
  }'`
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background radial gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-600/15 via-purple-600/5 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-indigo-900/10 blur-[140px] pointer-events-none" />
        <div className="absolute top-[1600px] -right-40 w-[700px] h-[700px] bg-purple-900/10 blur-[150px] pointer-events-none" />
      </div>

      {/* Top Bar / SaaS Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  Aegis <span className="text-indigo-400 font-mono text-xs px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 font-semibold">AI</span>
                </span>
                <span className="block text-[10px] text-zinc-400 font-medium tracking-wider uppercase -mt-0.5">Fashion Intelligence</span>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Sandbox</a>
            <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#api" className="hover:text-white transition-colors">API Docs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white px-3 py-1.5 transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <a
              href="#early-access"
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center gap-1.5"
            >
              Request API Key
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 sm:pt-28 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        {/* Model Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          Powered by Anthropic Claude 3.5 Sonnet & Claude Vision
          <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.12]">
          Autonomous Style Intelligence & Merchandising for Modern Fashion
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
          Aegis AI transforms raw apparel imagery and product specifications into studio-grade editorial copy, dynamic style graphs, and hyper-personalized customer recommendations in milliseconds.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#demo"
            className="px-6 py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-sm hover:bg-zinc-200 transition-all shadow-xl shadow-white/10 flex items-center gap-2 group"
          >
            Launch Interactive Sandbox
            <Sparkles className="w-4 h-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
          </a>
          <a
            href="#architecture"
            className="px-6 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 font-semibold text-sm hover:bg-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-2"
          >
            <Code2 className="w-4 h-4 text-zinc-400" />
            View Developer Specs
          </a>
        </div>

        {/* Metric Strip */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto border-y border-zinc-800/80 py-8 bg-zinc-950/40 backdrop-blur-sm">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">99.8%</div>
            <div className="text-xs text-zinc-400 font-medium mt-1">Multi-modal Tag Accuracy</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 tracking-tight">3.8x</div>
            <div className="text-xs text-zinc-400 font-medium mt-1">Shopper Conversion Lift</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">&lt;450ms</div>
            <div className="text-xs text-zinc-400 font-medium mt-1">Inference Latency</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 tracking-tight">120k+</div>
            <div className="text-xs text-zinc-400 font-medium mt-1">SKUs Enriched Monthly</div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 font-mono">Live Interactive Sandbox</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            See the Multi-Modal Reasoning Engine in Action
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            Select a sample garment and test how Aegis AI analyzes silhouette, fabric drape, and style ontology using Claude 3.5 Sonnet.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* Garment Selector & Image Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
                1. Select Garment SKU
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PRESET_GARMENTS.map((g) => {
                  const isSelected = selectedGarment.id === g.id
                  return (
                    <button
                      key={g.id}
                      onClick={() => handleSimulateAnalysis(g, activeTab)}
                      className={`p-2.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-500/20'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-2 relative bg-zinc-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={g.imageUrl}
                          alt={g.name}
                          className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="text-[11px] font-semibold text-white truncate">{g.name}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{g.category}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected Garment Detail Card */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400">Inspected Garment</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">SKU-{selectedGarment.id.toUpperCase()}-2026</span>
              </div>
              <h3 className="text-base font-bold text-white">{selectedGarment.name}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                Specs: {selectedGarment.specs}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-indigo-400 pt-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Multi-modal Vision Ingestion: 2048x2048px RGB</span>
              </div>
            </div>
          </div>

          {/* Model Reasoning & Output Console */}
          <div className="lg:col-span-7 space-y-5">
            {/* Action Tabs */}
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
                2. Choose Reasoning Pipeline
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                <button
                  onClick={() => handleSimulateAnalysis(selectedGarment, 'merchandising')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'merchandising'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Shirt className="w-3.5 h-3.5" />
                  Editorial Copy
                </button>
                <button
                  onClick={() => handleSimulateAnalysis(selectedGarment, 'styling')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'styling'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Style Synthesizer
                </button>
                <button
                  onClick={() => handleSimulateAnalysis(selectedGarment, 'trends')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'trends'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Trend Analytics
                </button>
              </div>
            </div>

            {/* Console Output Area */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 relative min-h-[380px] flex flex-col font-sans">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono text-zinc-300">claude-3-5-sonnet:stream-response</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
                  <span>Confidence: <strong className="text-emerald-400">{selectedGarment.actions.merchandising.confidence}</strong></span>
                </div>
              </div>

              {isGenerating ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-zinc-400">
                  <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                  <span className="text-xs font-mono">Synthesizing garment ontology with Claude Vision...</span>
                </div>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm">
                  {activeTab === 'merchandising' && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Generated Editorial Headline</span>
                        <h4 className="text-base font-bold text-white mt-1">
                          {selectedGarment.actions.merchandising.title}
                        </h4>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Brand Story & Merchandising Copy</span>
                        <p className="mt-1 text-zinc-300 leading-relaxed bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80">
                          {selectedGarment.actions.merchandising.editorial}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Taxonomy & Trend Meta Tags</span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {selectedGarment.actions.merchandising.tags.map((tag) => (
                            <span key={tag} className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'styling' && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Curated Style Concept</span>
                        <h4 className="text-base font-bold text-white mt-1">
                          {selectedGarment.actions.styling.lookName}
                        </h4>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Harmonized Color Palette</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedGarment.actions.styling.palette.map((c) => (
                            <span key={c} className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-mono">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Automated Basket / Bundle Recommendations</span>
                        <ul className="mt-2 space-y-1.5">
                          {selectedGarment.actions.styling.recommendedPairs.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-zinc-300 bg-zinc-900/40 px-3 py-2 rounded-lg border border-zinc-800/50">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <p className="text-[11px] text-zinc-400 italic pt-1 border-t border-zinc-850">
                        Reasoning Rationale: {selectedGarment.actions.styling.rationale}
                      </p>
                    </div>
                  )}

                  {activeTab === 'trends' && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Demand Velocity & Velocity Index</span>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xl font-bold text-emerald-400 font-mono">
                            {selectedGarment.actions.trends.velocityIndex}
                          </span>
                          <span className="text-xs text-zinc-300">
                            {selectedGarment.actions.trends.sentiment}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Seasonal Lifecycle Window</span>
                        <div className="mt-1 text-sm font-semibold text-white">
                          {selectedGarment.actions.trends.seasonFit}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Target Customer Demographic Persona</span>
                        <p className="mt-1 text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80">
                          {selectedGarment.actions.trends.targetAudience}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 font-mono">Engine Architecture</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Engineered Specifically for Apparel & Fashion Retailers
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            Generic LLMs hallucinate garment fits and fabric structures. Aegis AI grounds Anthropic Claude with deep multi-modal fashion ontologies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Modal Drape & Fabric Vision</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Claude 3.5 Vision decomposes high-resolution garment imagery down to weave density, lapel curves, pocket placements, and garment silhouette without manual data entry.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Brand Voice Preservation</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Inject your brand guidelines, editorial stylebooks, and banned vocabulary. Every product story reads like it was authored by your senior creative director.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/40 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Headless Commerce Connectors</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Native webhooks and RESTful APIs sync directly into Shopify Plus, Magento, BigCommerce, or custom Next.js storefronts with automatic JSON schema validation.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Architecture & Code Section */}
      <section id="architecture" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Developer First API</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
              One Unified API for Catalog Enrichment & Real-time Styling
            </h2>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Integrate Aegis AI into your ingest pipelines or consumer storefronts with minimal lines of code. Sub-450ms responses with structured JSON output guaranteed.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-white">Deterministic Output Schemas</div>
                  <div className="text-xs text-zinc-400">Strict Pydantic / TypeScript type definitions for every API response.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-white">Zero Data Retention Option</div>
                  <div className="text-xs text-zinc-400">Enterprise data privacy: your proprietary designs and catalog assets are never used for model training.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-white">Batch & Asynchronous Webhooks</div>
                  <div className="text-xs text-zinc-400">Enrich 50,000+ seasonal SKUs overnight with resilient background job queues.</div>
                </div>
              </div>
            </div>
          </div>

          <div id="api" className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/80 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCodeLang('typescript')}
                  className={`text-xs font-mono px-3 py-1 rounded-md transition-colors ${
                    codeLang === 'typescript' ? 'bg-indigo-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  TypeScript SDK
                </button>
                <button
                  onClick={() => setCodeLang('python')}
                  className={`text-xs font-mono px-3 py-1 rounded-md transition-colors ${
                    codeLang === 'python' ? 'bg-indigo-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Python SDK
                </button>
                <button
                  onClick={() => setCodeLang('curl')}
                  className={`text-xs font-mono px-3 py-1 rounded-md transition-colors ${
                    codeLang === 'curl' ? 'bg-indigo-600 text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
              </div>

              <button
                onClick={() => handleCopy(codeSnippets[codeLang])}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
                title="Copy code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="font-mono">{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-5 font-mono text-xs overflow-x-auto text-zinc-300 leading-relaxed bg-zinc-950/90">
              <pre>
                <code>{codeSnippets[codeLang]}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tier Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 font-mono">Transparent Pricing</div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Predictable Plans for Emerging & Enterprise Brands
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            Start in sandbox mode with Claude-powered test credits, scale seamlessly as your catalog expands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Developer Sandbox */}
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between space-y-6">
            <div>
              <div className="text-sm font-semibold text-zinc-300">Developer Sandbox</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$0</span>
                <span className="text-xs text-zinc-400">/ free trial</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                Ideal for testing API integrations and evaluating style reasoning on small test batches.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 1,000 SKUs enriched</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Claude 3.5 Haiku & Sonnet access</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Community Discord support</span>
                </li>
              </ul>
            </div>
            <a
              href="#early-access"
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs text-center transition-all block"
            >
              Get Free Sandbox Key
            </a>
          </div>

          {/* Growth Tier - Highlighted */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-zinc-900/80 border-2 border-indigo-500/80 relative flex flex-col justify-between space-y-6 shadow-2xl shadow-indigo-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider">
              Most Popular for D2C Brands
            </div>
            <div>
              <div className="text-sm font-semibold text-indigo-300">Growth Brand</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$199</span>
                <span className="text-xs text-zinc-400">/ month</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                For scaling fashion brands requiring automated editorial copy and localized multi-language tags.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Up to 25,000 SKUs / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Full Claude 3.5 Sonnet Vision Pipeline</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Custom Brand Tone of Voice fine-tuning</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Shopify & Headless webhooks</span>
                </li>
              </ul>
            </div>
            <a
              href="#early-access"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center transition-all block shadow-lg shadow-indigo-600/30"
            >
              Start Growth Trial
            </a>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between space-y-6">
            <div>
              <div className="text-sm font-semibold text-zinc-300">Retail Enterprise</div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">Custom</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                For global retail conglomerates, marketplace operators, and high-volume apparel manufacturers.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Unlimited SKUs & Dedicated Rate Limits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Private VPC deployment & Zero Retention</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Dedicated AI Solutions Engineer & 99.99% SLA</span>
                </li>
              </ul>
            </div>
            <a
              href="#early-access"
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs text-center transition-all block"
            >
              Talk to Enterprise Sales
            </a>
          </div>
        </div>
      </section>

      {/* Early Access / Contact Form Section */}
      <section id="early-access" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-zinc-800/60">
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 blur-[100px] pointer-events-none" />

          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 font-mono">Join Private Beta</div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Request Your Aegis AI API Credentials
            </h2>
            <p className="mt-2 text-zinc-400 text-xs sm:text-sm">
              We review and provision sandbox API keys within 24 hours. Connect with our engineering team to trial Claude 3.5 for your apparel catalog.
            </p>
          </div>

          {formSubmitted ? (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-3">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Application Received Successfully</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto">
                Thank you for your interest in Aegis AI. An onboarding link and Sandbox API token have been sent to <strong>{formData.email || 'your email'}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-lg mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1.5">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="alex@fashionbrand.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Brand / Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atelier Studio London"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1.5">Catalog SKU Volume</label>
                <select
                  value={formData.skuVolume}
                  onChange={(e) => setFormData({ ...formData, skuVolume: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option>&lt; 1,000 SKUs (Seed / Boutique)</option>
                  <option>1,000 - 10,000 SKUs (Growth Brand)</option>
                  <option>10,000 - 100,000 SKUs (Large Retailer)</option>
                  <option>100,000+ SKUs (Global Enterprise)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 mt-4"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Provisioning Sandbox Key...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Request for Sandbox Access</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Modern SaaS Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">Aegis AI</span>
              <span className="text-[11px] text-zinc-400 block">Fashion Merchandising & Style Intelligence</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-white transition-colors">Demo</a>
            <a href="#architecture" className="hover:text-white transition-colors">API Specs</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="mailto:founder@aegiscollection.biz.id" className="hover:text-white transition-colors">contact@aegiscollection.biz.id</a>
          </div>

          <div className="text-zinc-400">
            © 2026 Aegis AI / Aegis Collection Technology. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
