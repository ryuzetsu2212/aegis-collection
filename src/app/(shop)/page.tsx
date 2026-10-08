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
  ChevronRight,
  Send,
  Database,
  Lock,
  Compass,
  FileText,
  SlidersHorizontal,
  BookmarkCheck,
  Menu,
  X
} from 'lucide-react'

// Garment Presets for Sandbox
const PRESETS = [
  {
    id: 'coat',
    title: 'Virgin Wool Tailored Trench',
    sku: 'AEGIS-W26-TRN',
    category: 'Outerwear',
    color: 'Camel Warm Sand',
    fabric: '100% Italian Virgin Wool (380 GSM)',
    silhouette: 'Relaxed Double-Breasted with Storm Flap',
    image: '🧥',
    attributes: {
      formality: 'High Editorial / Formal',
      season: 'Autumn / Winter 2026',
      drapeIndex: '0.84 (Structured Firm)',
      texture: 'Brushed Melange Twill',
    },
    claudeAnalysis: {
      copy: 'Sculpted from heavy Italian virgin wool, this double-breasted trench balances architectural volume with effortless drape. Deep raglan sleeves and storm flaps invoke timeless military provenance, updated for contemporary transitional layering.',
      seoTags: ['camel wool trench', 'double breasted coat', 'tailored outerwear', 'autumn wardrobe investment'],
      recommendations: [
        { name: 'Ribbed Cashmere Mockneck in Oatmeal', rationale: 'Harmonizes collar heights and adds tactile warmth.' },
        { name: 'Pleated Flannel Trousers in Charcoal', rationale: 'Grounds the camel palette with sharp masculine tailoring.' },
        { name: 'Polished Calfskin Chelsea Boots', rationale: 'Balances the hem drape with minimal clean footwear.' }
      ],
      confidence: '99.6%',
      tokensUsed: 420
    }
  },
  {
    id: 'dress',
    title: 'Bias-Cut Silk Charmeuse Slip',
    sku: 'AEGIS-S26-SLP',
    category: 'Dresses',
    color: 'Obsidian Midnight',
    fabric: '100% Mulberry Silk (22 Momme)',
    silhouette: 'Bias-Cut Fluid Midi with Cowl Neck',
    image: '👗',
    attributes: {
      formality: 'Cocktail / Evening Gala',
      season: 'Transitional All-Season',
      drapeIndex: '0.96 (Liquid Fluidity)',
      texture: 'Lustrous Satin Weave',
    },
    claudeAnalysis: {
      copy: 'Spun from luminous 22-momme Mulberry silk, this cowl-neck slip cuts along the grain for an intuitive, liquid silhouette. The draped neckline and delicate French seams distill pure 90s minimalism into an essential evening silhouette.',
      seoTags: ['silk slip dress', 'bias cut evening dress', 'minimalist black midi', 'mulberry silk gown'],
      recommendations: [
        { name: 'Oversized Mohair Cardigan in Chalk', rationale: 'Textural contrast softens evening sheen into daytime luxury.' },
        { name: 'Sculptural Brass Ear Cuffs', rationale: 'Geometric metallic contrast elevates the fluid drape.' },
        { name: 'Strappy Kitten Heels in Nappa', rationale: 'Maintains delicate proportions without overpowering the slip.' }
      ],
      confidence: '99.4%',
      tokensUsed: 388
    }
  },
  {
    id: 'jacket',
    title: 'Kurabo Raw Selvedge Trucker',
    sku: 'AEGIS-D26-JKT',
    category: 'Denim',
    color: 'Deep Indigo Raw',
    fabric: '14.5oz Japanese Kurabo Selvedge Denim',
    silhouette: 'Boxy Type-II Workwear Silhouette',
    image: '👔',
    attributes: {
      formality: 'Elevated Casual / Heritage',
      season: 'Year-Round Utility',
      drapeIndex: '0.62 (Rigid Architectural)',
      texture: 'Unwashed Shuttle-Loomed Twill',
    },
    claudeAnalysis: {
      copy: 'Milled in Okayama on vintage Toyoda shuttle looms, this 14.5oz raw indigo trucker exhibits pronounced slub character and red-line selvedge ID. Cut boxy through the chest with pleat details for ergonomic durability.',
      seoTags: ['japanese selvedge jacket', 'raw denim trucker', 'kurabo mills outerwear', 'heritage workwear'],
      recommendations: [
        { name: 'Heavyweight Loopwheel Tee in Off-White', rationale: 'Substantial 300gsm jersey holds up against rigid denim collar.' },
        { name: 'Washed Army Chino in Olive', rationale: 'Classic mid-century military contrast against dark indigo.' },
        { name: 'Waxed Suede Service Boots', rationale: 'Patina synergy between unwashed cotton and roughout leather.' }
      ],
      confidence: '99.8%',
      tokensUsed: 442
    }
  }
]

export default function AegisClaudeLanding() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activePreset, setActivePreset] = useState(PRESETS[0])
  const [activeMode, setActiveMode] = useState<'copy' | 'style' | 'specs'>('copy')
  const [isSimulating, setIsSimulating] = useState(false)
  const [activeCodeTab, setActiveCodeTab] = useState<'ts' | 'curl' | 'py'>('ts')
  
  // Early access form state
  const [email, setEmail] = useState('')
  const [brand, setBrand] = useState('')
  const [skuCount, setSkuCount] = useState('10,000 - 50,000 SKUs')
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setIsSimulating(true)
    setActivePreset(preset)
    setTimeout(() => {
      setIsSimulating(false)
    }, 450)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setFormSubmitted(true)
  }

  return (
    <div className="w-full bg-[#f5f4ed] text-[#141413] min-h-screen selection:bg-[#c96442]/20 selection:text-[#c96442]">
      {/* Top Header / Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-[#e8e6dc] bg-[#f5f4ed]/95 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
                if (window.location.hash) {
                  history.pushState(null, '', window.location.pathname)
                }
              }}
              className="flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-[#141413] flex items-center justify-center text-[#faf9f5] font-claude-serif text-lg font-medium shadow-sm group-hover:bg-[#c96442] transition-colors">
                Æ
              </div>
              <div className="flex flex-col">
                <span className="font-claude-serif text-xl font-medium tracking-tight text-[#141413]">
                  Aegis AI
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#87867f] -mt-1 font-mono">
                  Anthropic Partner
                </span>
              </div>
            </a>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-[15px] font-normal text-[#5e5d59]">
            <a href="#architecture" className="hover:text-[#141413] transition-colors">Architecture</a>
            <a href="#sandbox" className="hover:text-[#141413] transition-colors">Live Sandbox</a>
            <a href="#api" className="hover:text-[#141413] transition-colors">Developer Specs</a>
            <a href="#pricing" className="hover:text-[#141413] transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#sandbox"
              className="text-sm font-medium text-[#4d4c48] px-3.5 py-2 rounded-lg hover:text-[#141413] transition-colors hidden sm:inline-block"
            >
              Demo
            </a>
            <a
              href="#access"
              className="text-xs sm:text-sm font-medium bg-[#c96442] text-[#faf9f5] px-3 sm:px-4 py-2 rounded-lg hover:bg-[#b85838] transition-colors shadow-xs whitespace-nowrap"
            >
              Request API Key
            </a>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#141413] hover:bg-[#eae8dd] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Garis 3) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#e8e6dc] bg-[#f5f4ed] px-6 py-4 shadow-lg animate-in fade-in duration-200">
            <nav className="flex flex-col space-y-3 text-[15px] font-normal text-[#5e5d59]">
              <a
                href="#architecture"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#141413] transition-colors"
              >
                Architecture
              </a>
              <a
                href="#sandbox"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#141413] transition-colors"
              >
                Live Sandbox
              </a>
              <a
                href="#api"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#141413] transition-colors"
              >
                Developer Specs
              </a>
              <a
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-1.5 hover:text-[#141413] transition-colors"
              >
                Pricing
              </a>
              <div className="pt-2 border-t border-[#e8e6dc] flex flex-col gap-2">
                <a
                  href="#access"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center text-sm font-medium bg-[#c96442] text-[#faf9f5] py-2.5 rounded-lg hover:bg-[#b85838] transition-colors"
                >
                  Request Sandbox API Key
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-6 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          {/* Overline Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#e8e6dc] bg-[#faf9f5] text-xs text-[#5e5d59] mb-8 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#c96442] animate-pulse" />
            <span className="font-mono text-[11px] text-[#4d4c48]">Powered by Claude 4.6 Sonnet & Claude Vision</span>
          </div>

          {/* Display Headline */}
          <h1 className="font-claude-serif text-4xl sm:text-5xl md:text-6xl text-[#141413] font-normal tracking-tight leading-[1.12] mb-7">
            Autonomous Style Intelligence for Modern Apparel.
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-[#5e5d59] leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
            Aegis AI couples Anthropic Claude 4.6 Sonnet’s multi-modal visual reasoning with deep fashion ontologies. Transform flat-lay garment photos into high-converting editorial merchandising, dynamic style graphs, and personalized wardrobe recommendations in milliseconds.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a
              href="#access"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#c96442] text-[#faf9f5] text-[15px] font-medium px-6 py-3.5 rounded-xl hover:bg-[#b85838] transition-all shadow-sm group"
            >
              <span>Apply for API Sandbox Access</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="#sandbox"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#e8e6dc] text-[#4d4c48] text-[15px] font-medium px-6 py-3.5 rounded-xl hover:bg-[#dfdcd0] transition-colors"
            >
              <span>Explore Interactive Sandbox</span>
            </a>
          </div>

          {/* Metrics & Trust Band */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-[#e8e6dc] text-left">
            <div>
              <div className="font-claude-serif text-2xl md:text-3xl font-normal text-[#141413]">99.8%</div>
              <div className="text-xs text-[#87867f] mt-1 font-sans">Multi-Modal Silhouette Precision</div>
            </div>
            <div>
              <div className="font-claude-serif text-2xl md:text-3xl font-normal text-[#141413]">3.8x</div>
              <div className="text-xs text-[#87867f] mt-1 font-sans">E-Commerce Lookbook Conversion</div>
            </div>
            <div>
              <div className="font-claude-serif text-2xl md:text-3xl font-normal text-[#141413]">&lt;450ms</div>
              <div className="text-xs text-[#87867f] mt-1 font-sans">Edge Inference Latency</div>
            </div>
            <div>
              <div className="font-claude-serif text-2xl md:text-3xl font-normal text-[#141413]">Zero</div>
              <div className="text-xs text-[#87867f] mt-1 font-sans">Customer Data Retention</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Sandbox Section */}
      <section id="sandbox" className="py-20 px-6 bg-[#faf9f5] border-y border-[#e8e6dc]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-[#c96442] mb-2">Live Demonstration</div>
              <h2 className="font-claude-serif text-3xl md:text-4xl text-[#141413] font-normal tracking-tight">
                Interactive Styling & Reasoning Console
              </h2>
            </div>
            <p className="text-sm text-[#5e5d59] max-w-md">
              Select an apparel garment below to inspect real-time Claude 4.6 Sonnet multi-modal extraction, style ontology tagging, and automated editorial synthesis.
            </p>
          </div>

          {/* Sandbox Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Preset Catalog */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-medium text-[#87867f] px-1 uppercase tracking-wider">
                Select Test Garment SKU
              </div>
              {PRESETS.map((p) => {
                const isSelected = activePreset.id === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPreset(p)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-sm flex items-start gap-4 ${
                      isSelected
                        ? 'bg-[#ffffff] border-[#c96442] shadow-sm'
                        : 'bg-[#faf9f5] border-[#e8e6dc] hover:bg-[#ffffff] hover:border-[#d1cfc5]'
                    }`}
                  >
                    <div className="text-3xl p-2 rounded-lg bg-[#f5f4ed] border border-[#e8e6dc]">
                      {p.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[#141413] truncate">{p.title}</span>
                        <span className="text-[11px] font-mono text-[#87867f]">{p.category}</span>
                      </div>
                      <div className="text-xs text-[#5e5d59] truncate mb-2">{p.fabric}</div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#f5f4ed] text-[#5e5d59]">
                          {p.color}
                        </span>
                        <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#f5f4ed] text-[#5e5d59]">
                          {p.attributes.season}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}

              <div className="p-4 rounded-xl border border-[#e8e6dc] bg-[#f5f4ed] text-xs text-[#5e5d59] space-y-2">
                <div className="font-medium text-[#141413] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#c96442]" />
                  <span>Deterministic Fashion Ontologies</span>
                </div>
                <p className="leading-relaxed">
                  Every extraction passes through our structured ontology validator to prevent model hallucination in fabric GSM, weave structures, and seam constructions.
                </p>
              </div>
            </div>

            {/* Right Column: Claude Reasoning Output */}
            <div className="lg:col-span-7 bg-[#ffffff] border border-[#e8e6dc] rounded-2xl shadow-xs overflow-hidden">
              {/* Header Bar */}
              <div className="p-4 border-b border-[#e8e6dc] bg-[#faf9f5] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-1 rounded bg-[#e8e6dc] text-[#141413]">
                    {activePreset.sku}
                  </span>
                  <span className="text-xs text-[#87867f]">•</span>
                  <span className="text-xs text-[#5e5d59] font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#c96442]" />
                    Claude 4.6 Sonnet Vision
                  </span>
                </div>

                {/* Sub tabs */}
                <div className="flex items-center gap-1 bg-[#f5f4ed] p-1 rounded-lg border border-[#e8e6dc]">
                  <button
                    onClick={() => setActiveMode('copy')}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      activeMode === 'copy'
                        ? 'bg-[#ffffff] text-[#141413] font-medium shadow-2xs'
                        : 'text-[#5e5d59] hover:text-[#141413]'
                    }`}
                  >
                    Editorial Copy
                  </button>
                  <button
                    onClick={() => setActiveMode('style')}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      activeMode === 'style'
                        ? 'bg-[#ffffff] text-[#141413] font-medium shadow-2xs'
                        : 'text-[#5e5d59] hover:text-[#141413]'
                    }`}
                  >
                    Lookbook Stylist
                  </button>
                  <button
                    onClick={() => setActiveMode('specs')}
                    className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                      activeMode === 'specs'
                        ? 'bg-[#ffffff] text-[#141413] font-medium shadow-2xs'
                        : 'text-[#5e5d59] hover:text-[#141413]'
                    }`}
                  >
                    Vision Attributes
                  </button>
                </div>
              </div>

              {/* Main Console Body */}
              <div className="p-6">
                {isSimulating ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-[#c96442] border-t-transparent animate-spin mb-3" />
                    <div className="text-sm font-medium text-[#141413]">Decomposing Garment Imagery...</div>
                    <div className="text-xs text-[#87867f] mt-1 font-mono">Passing tokens to Claude 4.6 Sonnet Vision API</div>
                  </div>
                ) : (
                  <div>
                    {activeMode === 'copy' && (
                      <div className="space-y-6">
                        <div>
                          <div className="text-xs font-mono uppercase tracking-wider text-[#87867f] mb-2">
                            Generated Editorial Narrative
                          </div>
                          <p className="font-claude-serif text-xl text-[#141413] leading-relaxed italic bg-[#f5f4ed] p-4 rounded-xl border border-[#e8e6dc]">
                            “{activePreset.claudeAnalysis.copy}”
                          </p>
                        </div>

                        <div>
                          <div className="text-xs font-mono uppercase tracking-wider text-[#87867f] mb-2">
                            Extracted High-Intent E-Commerce Meta Tags
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activePreset.claudeAnalysis.seoTags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#f5f4ed] border border-[#e8e6dc] text-[#4d4c48]"
                              >
                                <span>#</span>
                                <span>{tag}</span>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#f0eee6] flex items-center justify-between text-xs font-mono text-[#87867f]">
                          <span>Confidence Score: {activePreset.claudeAnalysis.confidence}</span>
                          <span>Prompt Tokens: {activePreset.claudeAnalysis.tokensUsed} tokens</span>
                        </div>
                      </div>
                    )}

                    {activeMode === 'style' && (
                      <div className="space-y-4">
                        <div className="text-xs font-mono uppercase tracking-wider text-[#87867f] mb-1">
                          Complementary Wardrobe Pairings (Style Graph)
                        </div>
                        <div className="space-y-3">
                          {activePreset.claudeAnalysis.recommendations.map((rec, i) => (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] flex items-start gap-3"
                            >
                              <div className="w-5 h-5 rounded-full bg-[#c96442]/10 text-[#c96442] flex items-center justify-center font-mono text-xs font-bold mt-0.5">
                                {i + 1}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-[#141413]">{rec.name}</div>
                                <div className="text-xs text-[#5e5d59] mt-0.5 leading-relaxed">{rec.rationale}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeMode === 'specs' && (
                      <div className="space-y-4">
                        <div className="text-xs font-mono uppercase tracking-wider text-[#87867f] mb-1">
                          Multi-Modal Inferred Specs
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-lg bg-[#f5f4ed] border border-[#e8e6dc]">
                            <span className="text-[#87867f] block">Fabric Composition</span>
                            <span className="font-medium text-[#141413] mt-0.5 block">{activePreset.fabric}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-[#f5f4ed] border border-[#e8e6dc]">
                            <span className="text-[#87867f] block">Silhouette Profile</span>
                            <span className="font-medium text-[#141413] mt-0.5 block">{activePreset.silhouette}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-[#f5f4ed] border border-[#e8e6dc]">
                            <span className="text-[#87867f] block">Formality Index</span>
                            <span className="font-medium text-[#141413] mt-0.5 block">{activePreset.attributes.formality}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-[#f5f4ed] border border-[#e8e6dc]">
                            <span className="text-[#87867f] block">Drape Resistance</span>
                            <span className="font-medium text-[#141413] mt-0.5 block">{activePreset.attributes.drapeIndex}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 2: Technical Architecture (Dark Section ala Anthropic Near Black) */}
      <section id="architecture" className="py-24 px-6 bg-[#141413] text-[#faf9f5]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#30302e] border border-[#4d4c48] text-xs text-[#d97757] font-mono mb-4">
              <Terminal className="w-3.5 h-3.5" />
              <span>Headless REST & Streaming API</span>
            </div>
            <h2 className="font-claude-serif text-3xl md:text-5xl text-[#faf9f5] font-normal tracking-tight leading-tight mb-4">
              Built for High-Volume Catalog Pipelines
            </h2>
            <p className="text-base md:text-lg text-[#b0aea5] leading-relaxed">
              Plug Aegis AI directly into your Shopify Plus, WooCommerce, or custom ERP. Dispatch high-res product shoots and receive structured JSON catalog enrichments with strict type contracts.
            </p>
          </div>

          {/* Code Showcase Terminal */}
          <div id="api" className="bg-[#1c1c1b] border border-[#30302e] rounded-2xl overflow-hidden shadow-2xl scroll-mt-24">
            {/* Terminal Tab Bar */}
            <div className="px-4 py-3 bg-[#171716] border-b border-[#30302e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#3d3d3a]" />
                <span className="w-3 h-3 rounded-full bg-[#3d3d3a]" />
                <span className="w-3 h-3 rounded-full bg-[#3d3d3a]" />
                <span className="ml-2 text-xs font-mono text-[#87867f]">api.aegiscollection.biz.id</span>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveCodeTab('ts')}
                  className={`text-xs px-3 py-1 rounded font-mono transition-colors ${
                    activeCodeTab === 'ts'
                      ? 'bg-[#30302e] text-[#faf9f5]'
                      : 'text-[#87867f] hover:text-[#b0aea5]'
                  }`}
                >
                  TypeScript SDK
                </button>
                <button
                  onClick={() => setActiveCodeTab('curl')}
                  className={`text-xs px-3 py-1 rounded font-mono transition-colors ${
                    activeCodeTab === 'curl'
                      ? 'bg-[#30302e] text-[#faf9f5]'
                      : 'text-[#87867f] hover:text-[#b0aea5]'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveCodeTab('py')}
                  className={`text-xs px-3 py-1 rounded font-mono transition-colors ${
                    activeCodeTab === 'py'
                      ? 'bg-[#30302e] text-[#faf9f5]'
                      : 'text-[#87867f] hover:text-[#b0aea5]'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="p-6 font-claude-mono text-xs md:text-sm text-[#b0aea5] overflow-x-auto leading-relaxed">
              {activeCodeTab === 'ts' && (
                <pre>
{`import { AegisClient } from '@aegis-ai/sdk';

const aegis = new AegisClient({
  apiKey: process.env.AEGIS_API_KEY, // Provisioned via Sandbox
  engine: 'claude-4-6-sonnet',
});

// Process apparel photo shoot with multi-modal reasoning
const result = await aegis.merchandise.enrich({
  imageUrl: 'https://cdn.yourbrand.com/products/AW26_TRENCH_01.jpg',
  brandVoice: 'minimalist-editorial-luxury',
  extractAttributes: ['drape_index', 'gsm_estimate', 'silhouette', 'pairing_graph'],
  temperature: 0.2, // Deterministic extraction
});

console.log('Enriched Title:', result.editorialTitle);
console.log('Style Graph Pairings:', result.pairingGraph);`}
                </pre>
              )}

              {activeCodeTab === 'curl' && (
                <pre>
{`curl -X POST https://api.aegiscollection.biz.id/v1/merchandise/enrich \
  -H "Authorization: Bearer aegis_live_sec_..." \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://cdn.brand.com/lookbook/FW26_SLIP.jpg",
    "persona": "editorial_stylist",
    "targetLanguage": "en-US",
    "strictOntology": true
  }'`}
                </pre>
              )}

              {activeCodeTab === 'py' && (
                <pre>
{`from aegis_ai import AegisClient

client = AegisClient(api_key="aegis_live_sec_...")

# Batch SKU automated enrichment
enrichment = client.merchandise.enrich(
    image_url="https://cdn.brand.com/denim/TRUCKER_01.webp",
    brand_voice="heritage_workwear",
    output_schema="shopify_json_ld"
)

print(f"Generated SEO Copy: {enrichment.copy}")
print(f"Confidence: {enrichment.confidence_score}")`}
                </pre>
              )}
            </div>
          </div>

          {/* Three Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 rounded-2xl bg-[#1c1c1b] border border-[#30302e]">
              <div className="w-10 h-10 rounded-xl bg-[#30302e] flex items-center justify-center text-[#d97757] mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-claude-serif text-xl text-[#faf9f5] mb-2 font-normal">
                Multi-Modal Vision Pipeline
              </h3>
              <p className="text-sm text-[#b0aea5] leading-relaxed">
                Decomposes lapels, seams, knit gauges, and fabric drape directly from high-resolution studio assets.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#1c1c1b] border border-[#30302e]">
              <div className="w-10 h-10 rounded-xl bg-[#30302e] flex items-center justify-center text-[#d97757] mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-claude-serif text-xl text-[#faf9f5] mb-2 font-normal">
                Dynamic Style Graph
              </h3>
              <p className="text-sm text-[#b0aea5] leading-relaxed">
                Links every SKU to an interoperable vector wardrobe graph for real-time “Complete The Look” cart recommendations.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#1c1c1b] border border-[#30302e]">
              <div className="w-10 h-10 rounded-xl bg-[#30302e] flex items-center justify-center text-[#d97757] mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-claude-serif text-xl text-[#faf9f5] mb-2 font-normal">
                Enterprise Zero-Retention
              </h3>
              <p className="text-sm text-[#b0aea5] leading-relaxed">
                Zero training on your proprietary unreleased collection photos. Ephemeral inference with complete privacy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 3: Pricing Plans */}
      <section id="pricing" className="py-24 px-6 bg-[#f5f4ed]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-mono uppercase tracking-wider text-[#c96442] mb-2">Transparent Pricing</div>
            <h2 className="font-claude-serif text-3xl md:text-5xl text-[#141413] font-normal tracking-tight mb-4">
              Engineered for Emerging Brands to Retail Conglomerates
            </h2>
            <p className="text-sm md:text-base text-[#5e5d59]">
              Deploy our pre-trained Claude 4.6 Sonnet fashion models or connect custom fine-tuned brand adapters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1 */}
            <div className="p-8 rounded-2xl bg-[#faf9f5] border border-[#e8e6dc] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-[#87867f] uppercase mb-2">Developer Tier</div>
                <h3 className="font-claude-serif text-2xl text-[#141413] mb-1 font-normal">Sandbox</h3>
                <div className="text-3xl font-claude-serif text-[#141413] my-4">$0 <span className="text-xs font-sans text-[#87867f]">/ month</span></div>
                <p className="text-xs text-[#5e5d59] mb-6">Designed for testing and prototyping store extensions.</p>
                <ul className="space-y-3 text-xs text-[#4d4c48]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> 5,000 API requests / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Claude 4.6 Haiku reasoning</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Standard JSON-LD attributes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Community Discord Support</li>
                </ul>
              </div>
              <a
                href="#access"
                className="mt-8 block text-center py-2.5 px-4 rounded-xl bg-[#e8e6dc] text-[#4d4c48] text-xs font-medium hover:bg-[#dfdcd0] transition-colors"
              >
                Start in Sandbox
              </a>
            </div>

            {/* Plan 2: Featured */}
            <div className="p-8 rounded-2xl bg-[#ffffff] border-2 border-[#c96442] shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#c96442] text-[#faf9f5] text-[11px] font-mono px-3 py-0.5 rounded-full uppercase tracking-wider">
                Recommended for D2C Brands
              </div>
              <div>
                <div className="text-xs font-mono text-[#c96442] uppercase mb-2">Growth Tier</div>
                <h3 className="font-claude-serif text-2xl text-[#141413] mb-1 font-normal">Brand Production</h3>
                <div className="text-3xl font-claude-serif text-[#141413] my-4">$199 <span className="text-xs font-sans text-[#87867f]">/ month</span></div>
                <p className="text-xs text-[#5e5d59] mb-6">Full multi-modal pipeline for growing e-commerce catalogs.</p>
                <ul className="space-y-3 text-xs text-[#4d4c48]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> 100,000 API requests / month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Claude 4.6 Sonnet & Vision</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Dynamic Style Graph Engine</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Custom Brand Voice Persona tuning</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> 99.9% Production SLA</li>
                </ul>
              </div>
              <a
                href="#access"
                className="mt-8 block text-center py-2.5 px-4 rounded-xl bg-[#c96442] text-[#faf9f5] text-xs font-medium hover:bg-[#b85838] transition-colors"
              >
                Apply for Growth Access
              </a>
            </div>

            {/* Plan 3 */}
            <div className="p-8 rounded-2xl bg-[#faf9f5] border border-[#e8e6dc] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-[#87867f] uppercase mb-2">Enterprise Tier</div>
                <h3 className="font-claude-serif text-2xl text-[#141413] mb-1 font-normal">Retail Conglomerate</h3>
                <div className="text-3xl font-claude-serif text-[#141413] my-4">Custom <span className="text-xs font-sans text-[#87867f]">/ volume</span></div>
                <p className="text-xs text-[#5e5d59] mb-6">Dedicated inference clusters for global luxury brands.</p>
                <ul className="space-y-3 text-xs text-[#4d4c48]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Unlimited SKUs & Catalog Ingestion</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Dedicated Claude VPC Ingress</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> Custom Taxonomy & Ontologies</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#c96442]" /> 24/7 Dedicated Solutions Engineer</li>
                </ul>
              </div>
              <a
                href="#access"
                className="mt-8 block text-center py-2.5 px-4 rounded-xl bg-[#e8e6dc] text-[#4d4c48] text-xs font-medium hover:bg-[#dfdcd0] transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 4: Early Access Application Form */}
      <section id="access" className="py-20 px-6 bg-[#faf9f5] border-t border-[#e8e6dc]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#c96442]">Founder & Partner Sandbox</span>
            <h2 className="font-claude-serif text-3xl md:text-4xl text-[#141413] font-normal tracking-tight mt-1 mb-3">
              Request Your API Sandbox Key
            </h2>
            <p className="text-sm text-[#5e5d59]">
              We provision developer sandbox keys on a rolling basis. Enter your company credentials below for automated evaluation.
            </p>
          </div>

          <div className="bg-[#ffffff] border border-[#e8e6dc] rounded-2xl p-8 shadow-xs">
            {formSubmitted ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[#c96442]/10 text-[#c96442] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-claude-serif text-2xl text-[#141413] mb-2 font-normal">
                  Application Received
                </h3>
                <p className="text-sm text-[#5e5d59] max-w-md mx-auto mb-6">
                  Thank you for submitting your brand details. Our engineering team has queued your credentials and will dispatch your sandbox token to <span className="font-mono text-[#141413] font-medium">{email}</span> within 24 hours.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="text-xs text-[#c96442] hover:underline"
                >
                  Submit another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-[#4d4c48] mb-1.5">
                    Work Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@yourbrand.com"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] text-[#141413] focus:outline-none focus:border-[#3898ec] transition-colors"
                  />
                  <span className="text-[11px] text-[#87867f] mt-1 block">
                    Use your corporate email domain for priority verification.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4d4c48] mb-1.5">
                    Brand / Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Acme Apparel Studio"
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] text-[#141413] focus:outline-none focus:border-[#3898ec] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4d4c48] mb-1.5">
                    Current Catalog Volume
                  </label>
                  <select
                    value={skuCount}
                    onChange={(e) => setSkuCount(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 rounded-xl border border-[#e8e6dc] bg-[#faf9f5] text-[#141413] focus:outline-none focus:border-[#3898ec] transition-colors"
                  >
                    <option>&lt; 1,000 SKUs (Emerging Studio)</option>
                    <option>1,000 - 10,000 SKUs (Growth Brand)</option>
                    <option>10,000 - 50,000 SKUs (Retailer)</option>
                    <option>50,000+ SKUs (Global Enterprise)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#c96442] text-[#faf9f5] font-medium text-sm hover:bg-[#b85838] transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Request API Sandbox Key</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="py-16 px-6 border-t border-[#e8e6dc] bg-[#f5f4ed] text-xs text-[#5e5d59]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded bg-[#141413] text-[#faf9f5] font-claude-serif text-sm flex items-center justify-center font-medium">
                Æ
              </div>
              <span className="font-claude-serif text-base font-medium text-[#141413]">
                Aegis AI
              </span>
            </div>
            <p className="text-xs text-[#87867f] max-w-sm leading-relaxed mb-4">
              Autonomous multi-modal merchandising and style graph intelligence. Built on Anthropic Claude foundation models.
            </p>
            <div className="text-[11px] text-[#87867f]">
              © 2026 Aegis Collection Technology Ltd. All rights reserved.
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <div className="font-medium text-[#141413] mb-3">Architecture</div>
              <ul className="space-y-2">
                <li><a href="#sandbox" className="hover:text-[#141413] transition-colors">Vision Pipeline</a></li>
                <li><a href="#api" className="hover:text-[#141413] transition-colors">Style Graph</a></li>
                <li><a href="#api" className="hover:text-[#141413] transition-colors">REST SDKs</a></li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-[#141413] mb-3">Security & Compliance</div>
              <ul className="space-y-2">
                <li><span className="text-[#87867f]">Zero Data Retention</span></li>
                <li><span className="text-[#87867f]">SOC-2 Type II Ingress</span></li>
                <li><span className="text-[#87867f]">GDPR Compliant</span></li>
              </ul>
            </div>

            <div>
              <div className="font-medium text-[#141413] mb-3">Contact</div>
              <ul className="space-y-2">
                <li><span className="font-mono text-[#141413]">founder@aegiscollection.biz.id</span></li>
                <li><span className="text-[#87867f]">Jakarta • Singapore</span></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
