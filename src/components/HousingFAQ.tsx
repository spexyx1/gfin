import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Heart, Home, Users, DollarSign, Shield, Globe, Award, TrendingUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'sponsors' | 'tenants' | 'financial' | 'legal' | 'impact';
}

const faqData: FAQItem[] = [
  {
    category: 'general',
    question: 'What is the Housing NFT Marketplace?',
    answer: 'The Housing NFT Marketplace is a revolutionary platform where people purchase NFTs to fund housing rehabilitation and construction in impoverished communities worldwide. Each NFT represents revenue-sharing rights in a partnership with tenants who gain stable housing and economic opportunities. Together, we\'re creating pathways out of poverty while revitalizing struggling neighborhoods.'
  },
  {
    category: 'general',
    question: 'How does this initiative help people in poverty?',
    answer: 'This initiative provides three critical benefits: (1) Stable, affordable housing for families in need, (2) A platform to showcase and monetize their skills, goods, or services, and (3) Direct partnerships with generous sponsors who believe in their potential. We\'re not just providing shelter—we\'re unlocking human potential and creating dignity through opportunity.'
  },
  {
    category: 'sponsors',
    question: 'What exactly am I purchasing when I buy a Housing NFT?',
    answer: 'When you purchase a Housing NFT, you are acquiring revenue-sharing rights in a specific housing project. You are NOT purchasing the property itself—the platform retains ownership of the underlying property. Your NFT gives you the right to receive 10% of revenue generated when your partnered tenant sells goods or services through our platform. You also receive a lifetime platform listing fee waiver for your own listings.'
  },
  {
    category: 'legal',
    question: 'Who owns the property after funding?',
    answer: 'The platform retains legal ownership of all housing properties. This structure ensures long-term sustainability, proper maintenance, and continued support for tenants. Sponsors hold revenue-sharing rights, not property deeds. This allows us to keep housing costs low for families while creating an innovative investment model for sponsors.'
  },
  {
    category: 'financial',
    question: 'How is revenue shared between sponsors and tenants?',
    answer: 'Revenue sharing is structured to maximize tenant success: Tenants receive 85% of their platform sales (giving them strong incentive to succeed), Sponsors receive 10% (providing meaningful return on generosity), and the Platform receives 5% (covering operational costs and sustainability). For example, if a tenant generates $1,000 in sales, they keep $850, sponsors receive $100, and the platform receives $50.'
  },
  {
    category: 'sponsors',
    question: 'What is the lifetime platform fee waiver benefit?',
    answer: 'Both sponsors and their partnered tenants receive a lifetime waiver of platform listing fees. Normally, sellers pay a fee to list items on the platform. This waiver means you can list and sell your own items with zero listing fees for life—a valuable benefit that compounds over time. This is our way of thanking you for changing lives through your generosity.'
  },
  {
    category: 'tenants',
    question: 'How do tenants qualify for housing?',
    answer: 'Tenants apply through the platform by sharing their story, skills, and what they can offer. We prioritize families facing genuine hardship who demonstrate motivation to build a better life. Tenants commit to offering their skills, goods, or services through our platform and maintaining good standing in their partnership agreements. Character and determination matter more than current circumstances.'
  },
  {
    category: 'financial',
    question: 'Are NFT purchases tax-deductible?',
    answer: 'NFT purchases may qualify as charitable contributions depending on your jurisdiction and how our legal structure is configured. We recommend consulting with a tax professional in your country. The revenue-sharing component is taxable income when received. We provide annual statements to help with tax reporting.'
  },
  {
    category: 'sponsors',
    question: 'Can I visit the property or meet my partnered tenant?',
    answer: 'Yes! We encourage meaningful relationships between sponsors and tenants. Once a project is completed and tenant is placed, we facilitate introductions through our messaging system. Virtual meetings are encouraged, and in-person visits can be arranged with mutual consent. Many sponsors find these relationships deeply rewarding—seeing firsthand the impact of their generosity.'
  },
  {
    category: 'tenants',
    question: 'What types of skills or goods can tenants offer?',
    answer: 'Tenants can offer virtually anything legal and valuable: handmade crafts, art, clothing, food products, professional services (consulting, tutoring, design), home repairs, digital services, cultural items, and more. We help tenants photograph and list their offerings professionally. The platform provides the marketplace; tenants provide the talent and determination.'
  },
  {
    category: 'impact',
    question: 'How do you choose which communities to help?',
    answer: 'We target areas with high poverty rates, available properties, and strong community potential. Initial focus includes Detroit, Appalachia, Los Angeles, San Francisco, New Orleans, and international locations like Egypt, Cambodia, Thailand, South Africa, and India. We prioritize areas where small investments create maximum impact and where local talent is underutilized.'
  },
  {
    category: 'financial',
    question: 'What happens if a tenant doesn\'t generate revenue?',
    answer: 'Housing is never conditional on revenue generation—families keep their homes regardless. We work with tenants to develop marketable offerings and provide platform support. Not all partnerships will be equally profitable, which is why we encourage sponsors to diversify across multiple projects. The primary goal is housing security; revenue sharing is a bonus that creates sustainability.'
  },
  {
    category: 'sponsors',
    question: 'Can I sell or transfer my Housing NFT?',
    answer: 'Yes, Housing NFTs are transferable. You can sell your revenue-sharing rights to another person through our platform or compatible NFT marketplaces (once blockchain integration is complete). The new holder assumes all rights and benefits, including the lifetime fee waiver. Property ownership always remains with the platform, but revenue rights can change hands.'
  },
  {
    category: 'legal',
    question: 'What protections exist for sponsors and tenants?',
    answer: 'All partnerships operate under clear written agreements. Tenants have secure housing through our ownership model—they cannot be arbitrarily evicted. Sponsors have legally enforceable revenue-sharing rights. The platform acts as trusted intermediary, handling all payments, record-keeping, and dispute resolution. Third-party escrow protects all funds during project completion.'
  },
  {
    category: 'impact',
    question: 'How do you measure success beyond financial returns?',
    answer: 'We track family stability, children\'s school attendance, employment rates, health improvements, neighborhood revitalization, crime reduction, and overall quality of life indicators. We publish quarterly impact reports with photos, stories, and data. Success is measured in transformed lives, not just dollars. Every family housed represents immeasurable human potential unlocked.'
  },
  {
    category: 'general',
    question: 'Why should I trust this platform with my investment?',
    answer: 'Transparency is our foundation. All projects include detailed documentation, regular photo updates, and financial reporting. The platform uses blockchain technology for immutable record-keeping. Third-party audits verify fund usage. But beyond systems, this is a mission of faith, compassion, and human dignity. We\'re building a community of people who believe everyone deserves a chance.'
  },
  {
    category: 'tenants',
    question: 'What support do tenants receive beyond housing?',
    answer: 'Tenants receive: stable housing, business development coaching, free professional product photography, platform listing support, access to the global marketplace, direct mentorship opportunities with sponsors, and connection to a supportive community. We\'re invested in their long-term success—their wins are our wins.'
  },
  {
    category: 'financial',
    question: 'What is the minimum investment to participate?',
    answer: 'NFT prices vary by project, typically ranging from $500 to $5,000 depending on location and property costs. We deliberately keep prices accessible so people of modest means can participate in this mission. Even small investments create real impact when pooled together. Every NFT matters; every sponsor changes lives.'
  },
  {
    category: 'impact',
    question: 'What makes this different from traditional charity?',
    answer: 'Traditional charity often creates dependency. This creates opportunity and partnership. Tenants aren\'t recipients—they\'re entrepreneurs and partners. Sponsors aren\'t donors—they\'re impact investors. Revenue sharing aligns everyone\'s interests toward success. Dignity comes from earning, not receiving. We\'re not giving fish; we\'re providing the pond, the boat, and the marketplace.'
  },
  {
    category: 'sponsors',
    question: 'Can organizations or companies purchase NFTs?',
    answer: 'Absolutely! Corporations can participate as part of ESG initiatives, community investment, or employee engagement programs. Nonprofits can purchase NFTs to support their beneficiaries. Churches and faith communities can collectively fund projects. We provide customized reporting and recognition for organizational sponsors.'
  },
  {
    category: 'legal',
    question: 'What happens if the platform closes or changes?',
    answer: 'In the unlikely event of platform closure, tenants retain their housing (properties transfer to a housing trust), and sponsors retain revenue-sharing rights (enforced through legal agreements). We\'re building for generational impact with sustainability at our core. Properties are held in protected legal structures specifically designed for long-term mission continuity.'
  },
  {
    category: 'impact',
    question: 'How can I track the impact of my specific investment?',
    answer: 'Every sponsor receives a personalized dashboard showing their project\'s progress, funding milestones, construction updates, tenant stories, and revenue generated. You can see photos of "your" property, read updates from "your" tenant, and watch the direct impact of your generosity unfold in real-time. This isn\'t abstract charity—it\'s personal transformation you can see.'
  },
  {
    category: 'general',
    question: 'Is this really possible? Can we actually make a difference?',
    answer: 'Yes. Housing exists. Skills exist. Compassionate people exist. The market exists. We\'re simply connecting these pieces with technology and faith. Small acts of generosity, multiplied by many people, create transformational change. There is so much talent and skill being lost and untapped; people just need an opportunity. If we work together, we can make it happen, with God\'s help.'
  }
];

export function HousingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Questions', icon: Globe },
    { id: 'general', label: 'General', icon: Home },
    { id: 'sponsors', label: 'For Sponsors', icon: Heart },
    { id: 'tenants', label: 'For Tenants', icon: Users },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'legal', label: 'Legal & Trust', icon: Shield },
    { id: 'impact', label: 'Impact', icon: Award }
  ];

  const filteredFAQs = filterCategory === 'all'
    ? faqData
    : faqData.filter(faq => faq.category === filterCategory);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      <div className="text-center mb-8 sm:mb-12">
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <div className="relative">
            <Home className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-neon-yellow" />
            <Heart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500 absolute -bottom-2 -right-2 animate-pulse" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3 sm:mb-4 bg-gradient-to-r from-neon-yellow via-neon-orange to-neon-yellow bg-clip-text text-transparent uppercase px-2">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
          Everything you need to know about changing lives through housing sponsorship
        </p>
      </div>

      <div className="mb-6 sm:mb-8 grid grid-cols-2 sm:flex sm:flex-wrap gap-2 justify-center">
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setFilterCategory(id)}
            className={`flex items-center justify-center sm:justify-start space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-300 min-h-[44px] ${
              filterCategory === id
                ? 'bg-gradient-to-r from-neon-yellow to-neon-orange text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 active:bg-gray-600'
            }`}
          >
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="font-bold text-xs sm:text-sm">{label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredFAQs.map((faq, index) => (
          <div
            key={index}
            className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden hover:border-neon-yellow/30 active:border-neon-yellow/50 transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-gray-800/50 active:bg-gray-800 transition-colors min-h-[56px]"
            >
              <span className="text-white font-bold pr-3 sm:pr-4 text-sm sm:text-base">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-neon-yellow flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {openIndex === index && (
              <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                <div className="pt-2 pb-2 border-t border-gray-800">
                  <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <p className="text-gray-400 text-base sm:text-lg">No FAQs found in this category</p>
        </div>
      )}

      <div className="mt-8 sm:mt-12 bg-gradient-to-br from-blue-900/30 to-green-900/30 rounded-2xl p-4 sm:p-6 md:p-8 border border-blue-500/30">
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-neon-green flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-2 sm:mb-3">Still Have Questions?</h3>
            <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">
              We're here to help you understand how your generosity can change lives. Every question matters, and we're committed to complete transparency.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button className="px-4 sm:px-6 py-3 bg-gradient-to-r from-neon-yellow to-neon-orange text-black font-black rounded-lg hover:shadow-lg hover:shadow-neon-yellow/50 active:shadow-neon-orange/50 transition-all duration-300 text-sm sm:text-base min-h-[44px]">
                Contact Support
              </button>
              <button className="px-4 sm:px-6 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-white font-black rounded-lg transition-colors text-sm sm:text-base min-h-[44px]">
                Browse Projects
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
        <p className="text-yellow-200 text-center italic text-sm sm:text-base">
          "There is so much talent and skill being lost and untapped; people just need an opportunity. If we work together, we can make it happen, with God's help."
        </p>
      </div>
    </div>
  );
}
