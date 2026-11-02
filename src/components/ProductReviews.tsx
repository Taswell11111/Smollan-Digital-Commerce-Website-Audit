import React, { useState } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquare, Plus, Filter, Building2, Award } from 'lucide-react';

export interface ReviewItem {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  verified: boolean;
  sizePurchased: string; // Used as Scope / Project for B2B
  fitFeedback: string;   // Used as Outcome / SLA for B2B
  title: string;
  comment: string;
  helpfulCount: number;
}

interface ProductReviewsProps {
  brandName?: string;
  category?: string;
  itemTitle?: string;
  archetype?: 'b2b_service' | 'b2c_retail';
}

const DEFAULT_RETAIL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Sipho M.',
    location: 'Johannesburg, GP',
    rating: 5,
    date: '14 May 2024',
    verified: true,
    sizePurchased: 'UK 9',
    fitFeedback: 'True to Size',
    title: 'Timeless aesthetic and all-day comfort',
    comment:
      'The finish and soft lining feel exceptionally premium. Worn daily across Sandton and Rosebank; they break in quickly and match both casual and smart outfits effortlessly.',
    helpfulCount: 18,
  },
  {
    id: 'rev-2',
    author: 'Lerato K.',
    location: 'Cape Town, WC',
    rating: 5,
    date: '28 April 2024',
    verified: true,
    sizePurchased: 'UK 6',
    fitFeedback: 'True to Size',
    title: 'Perfect South African sizing match',
    comment:
      'Always hesitant ordering online, but South African sizing matches UK 1:1. The UK 6 fit like a glove. Arrived in Cape Town in 48 hours in immaculate condition.',
    helpfulCount: 12,
  },
  {
    id: 'rev-3',
    author: 'Devan P.',
    location: 'Durban, KZN',
    rating: 4,
    date: '03 March 2024',
    verified: true,
    sizePurchased: 'UK 10',
    fitFeedback: 'True to Size',
    title: 'Durable construction and iconic vintage profile',
    comment:
      'Subtle off-white midsole gives that authentic archive feel. Solid arch support for walking long distances. Very satisfied with the craftsmanship and quick dispatch.',
    helpfulCount: 7,
  },
  {
    id: 'rev-4',
    author: 'Chad v.d. M.',
    location: 'Pretoria, GP',
    rating: 5,
    date: '19 June 2024',
    verified: true,
    sizePurchased: 'UK 10',
    fitFeedback: 'True to Size',
    title: 'The gold standard for durability and comfort',
    comment:
      'The construction provides incredible stability. The "What Goes Well With" bundle option saved me 15% on the paired overshirt. Worth every Rand.',
    helpfulCount: 24,
  },
  {
    id: 'rev-5',
    author: 'Nandi B.',
    location: 'Centurion, GP',
    rating: 5,
    date: '02 June 2024',
    verified: true,
    sizePurchased: 'UK 5',
    fitFeedback: 'True to Size',
    title: 'Breathable and lightweight',
    comment:
      'The units left urgency indicator helped me secure my size before it ran out of stock. Fast delivery and high-end packaging.',
    helpfulCount: 15,
  }
];

const DEFAULT_B2B_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-b2b-1',
    author: 'Gareth V. · Head of Digital Commerce',
    location: 'Cape Town, WC',
    rating: 5,
    date: '18 April 2024',
    verified: true,
    sizePurchased: 'Headless Storefront & Core Web Vitals Architecture',
    fitFeedback: '+34% Mobile CRO Lift',
    title: 'Engineered a +34% lift in mobile conversion rate with zero checkout downtime',
    comment:
      'eComplete completely overhauled our storefront and checkout pathways. Their technical squads solved severe Core Web Vitals lag and re-architected our cart drawer. Our mobile conversion rate lifted by 34% within 60 days.',
    helpfulCount: 28,
  },
  {
    id: 'rev-b2b-2',
    author: 'Michelle D. · eCommerce Director',
    location: 'Johannesburg, GP',
    rating: 5,
    date: '02 May 2024',
    verified: true,
    sizePurchased: 'Conversion Diagnostic & UX Remediation Sprint',
    fitFeedback: '100% SLA Delivery',
    title: 'Engineering depth and commercial CRO rigor that paid for itself in 3 weeks',
    comment:
      'The conversion diagnostic was eye-opening. Rather than presenting generic slides, eComplete delivered drop-in Next.js code fixes that eliminated drop-off in our multi-currency checkout. The commercial ROI paid for the sprint within 3 weeks.',
    helpfulCount: 22,
  },
  {
    id: 'rev-b2b-3',
    author: 'Sean N. · VP Technology',
    location: 'Durban, KZN',
    rating: 5,
    date: '27 February 2024',
    verified: true,
    sizePurchased: 'Shopify Plus & Payment Gateway Middleware',
    fitFeedback: 'Enterprise Security Compliant',
    title: 'Outstanding technical execution across Shopify Plus and South African gateways',
    comment:
      'Superb integration across our ERP, Algolia search index, and South African payment gateways (Ozow, PayFlex, Peach Payments). Their engineering team demonstrates true enterprise discipline and security awareness.',
    helpfulCount: 17,
  },
  {
    id: 'rev-b2b-4',
    author: 'Anelda B. · Managing Director',
    location: 'Pretoria, GP',
    rating: 5,
    date: '11 June 2024',
    verified: true,
    sizePurchased: 'B2B Catalog & Ordering Architecture',
    fitFeedback: '+22% AOV Growth',
    title: 'Streamlined our B2B buyer ordering and self-service account flow',
    comment:
      'eComplete modernized our B2B ordering catalog and self-service client portal. Onboarding friction dropped immediately and average order value grew by 22% with automated POPIA compliance.',
    helpfulCount: 31,
  }
];

export const ProductReviews: React.FC<ProductReviewsProps> = ({ 
  brandName = 'Storefront', 
  category = 'Collection',
  itemTitle = 'Signature Piece',
  archetype = 'b2c_retail'
}) => {
  const isB2B = archetype === 'b2b_service';
  const initialReviews = isB2B ? DEFAULT_B2B_REVIEWS : DEFAULT_RETAIL_REVIEWS;

  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});

  // Review Form State
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formAuthor, setFormAuthor] = useState('');
  const [formRoleOrCity, setFormRoleOrCity] = useState('');
  const [formScopeOrSize, setFormScopeOrSize] = useState(isB2B ? 'CRO Diagnostic Sprint' : 'UK 8');
  const [formOutcome, setFormOutcome] = useState(isB2B ? '+25% Conversion Lift' : 'True to Size');
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // Compute average and breakdown
  const totalReviews = reviews.length;
  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / (totalReviews || 1)).toFixed(1);
  const recommendPercent = Math.round(
    (reviews.filter((r) => r.rating >= 4).length / (totalReviews || 1)) * 100
  );

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
  });

  const filteredReviews =
    filterRating === 'all' ? reviews : reviews.filter((r) => r.rating === filterRating);

  const handleVoteHelpful = (reviewId: string) => {
    if (helpfulVoted[reviewId]) return;
    setHelpfulVoted((prev) => ({ ...prev, [reviewId]: true }));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: r.helpfulCount + 1 } : r))
    );
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAuthor.trim() || !formTitle.trim() || !formComment.trim()) return;

    const newReview: ReviewItem = {
      id: `rev-user-${Date.now()}`,
      author: formAuthor.trim(),
      location: formRoleOrCity.trim() || (isB2B ? 'Enterprise Client, SA' : 'South Africa'),
      rating: formRating,
      date: 'Just now',
      verified: true,
      sizePurchased: formScopeOrSize,
      fitFeedback: formOutcome,
      title: formTitle.trim(),
      comment: formComment.trim(),
      helpfulCount: 0,
    };

    setReviews([newReview, ...reviews]);
    setShowReviewForm(false);
    setSubmittedMessage(true);

    // Reset Form
    setFormAuthor('');
    setFormRoleOrCity('');
    setFormTitle('');
    setFormComment('');
    setTimeout(() => setSubmittedMessage(false), 5000);
  };

  return (
    <section className="border-t border-slate-200 pt-10 mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isB2B ? (
              <Award className="w-5 h-5 text-[#00e5ff]" />
            ) : (
              <MessageSquare className="w-5 h-5 text-[#00e5ff]" />
            )}
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isB2B ? 'Verified Enterprise Client Endorsements' : 'Verified Customer Reviews & Social Proof'}
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            {isB2B
              ? `Ratings and verified commercial feedback from enterprise retail and digital commerce leaders partnering with ${brandName}`
              : `Ratings and authentic feedback from confirmed South African purchasers of ${brandName}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReviewForm((prev) => !prev)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#002157] text-[#00e5ff] hover:bg-slate-900 transition text-xs font-bold uppercase tracking-wider rounded-xl self-start sm:self-auto shrink-0 shadow border border-cyan-400/30"
        >
          <Plus className="w-4 h-4" />
          {showReviewForm ? 'Cancel Review' : isB2B ? 'Submit Client Endorsement' : 'Write a Review'}
        </button>
      </div>

      {submittedMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>
            {isB2B
              ? `Thank you! Your verified client endorsement has been added to ${brandName}'s credentials portfolio.`
              : `Thank you! Your verified customer review has been added to ${brandName}'s social proof ledger.`}
          </span>
        </div>
      )}

      {/* Review Form Drawer / Box */}
      {showReviewForm && (
        <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl animate-in fade-in">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
            {isB2B ? `Submit Client Testimonial for ${brandName}` : `Submit Customer Review for ${itemTitle}`}
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            {isB2B
              ? 'Your feedback helps enterprise peers evaluate commercial and engineering excellence.'
              : 'Feedback helps prospective buyers make confident purchasing choices.'}
          </p>

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Your Overall Rating
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setFormHoverRating(star)}
                    onMouseLeave={() => setFormHoverRating(0)}
                    onClick={() => setFormRating(star)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (formHoverRating || formRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">
                  {formHoverRating || formRating} of 5 Stars
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  {isB2B ? 'Full Name & Title' : 'Full Name / Display Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isB2B ? 'e.g. David M. · Head of Digital' : 'e.g. Jason V.'}
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  {isB2B ? 'Company & Location' : 'City / Province'}
                </label>
                <input
                  type="text"
                  placeholder={isB2B ? 'e.g. Retail Group SA, Cape Town' : 'e.g. Cape Town, WC'}
                  value={formRoleOrCity}
                  onChange={(e) => setFormRoleOrCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  {isB2B ? 'Engagement Scope' : 'Size Purchased'}
                </label>
                {isB2B ? (
                  <select
                    value={formScopeOrSize}
                    onChange={(e) => setFormScopeOrSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                  >
                    <option value="Headless Storefront & Core Web Vitals Architecture">Headless Storefront & Core Web Vitals Architecture</option>
                    <option value="Conversion Diagnostic & UX Remediation Sprint">Conversion Diagnostic & UX Remediation Sprint</option>
                    <option value="Shopify Plus & Payment Gateway Middleware">Shopify Plus & Payment Gateway Middleware</option>
                    <option value="B2B Catalog & Ordering Architecture">B2B Catalog & Ordering Architecture</option>
                  </select>
                ) : (
                  <select
                    value={formScopeOrSize}
                    onChange={(e) => setFormScopeOrSize(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                  >
                    {['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11', 'UK 12'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                  {isB2B ? 'Measured Commercial Outcome' : 'Fit Consensus'}
                </label>
                {isB2B ? (
                  <input
                    type="text"
                    placeholder="e.g. +34% Conversion Lift"
                    value={formOutcome}
                    onChange={(e) => setFormOutcome(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                  />
                ) : (
                  <select
                    value={formOutcome}
                    onChange={(e) => setFormOutcome(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
                  >
                    <option value="True to Size">True to Size (Recommended)</option>
                    <option value="Runs Small">Runs Small (Size up)</option>
                    <option value="Runs Large">Runs Large (Size down)</option>
                  </select>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                Headline / Summary
              </label>
              <input
                type="text"
                required
                placeholder={isB2B ? 'e.g. Delivered +30% mobile revenue lift within 60 days' : 'e.g. Excellent build quality, true to South African fit'}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                {isB2B ? 'Detailed Commercial Endorsement' : 'Review Comments'}
              </label>
              <textarea
                required
                rows={3}
                placeholder={isB2B ? 'Share specific engineering deliverables, communication quality, SLA adherence, and verified ROI...' : 'Share specific details on fabric texture, comfort, delivery speed, and durability...'}
                value={formComment}
                onChange={(e) => setFormComment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#002157]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#002157] text-[#00e5ff] rounded-xl text-xs font-bold hover:bg-slate-900 transition shadow"
              >
                {isB2B ? 'Submit Endorsement' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ratings Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 bg-slate-50/70 p-6 sm:p-8 rounded-3xl border border-slate-200">
        {/* Left Column: Overall Score & Recommendation */}
        <div className="md:col-span-4 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-200 pb-6 md:pb-0 md:pr-8 text-center md:text-left">
          <div className="flex items-baseline justify-center md:justify-start gap-2 mb-2">
            <span className="text-5xl font-black text-[#002157] tracking-tight">{avgRating}</span>
            <span className="text-slate-400 text-base font-bold">/ 5.0</span>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-1 text-amber-400 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(Number(avgRating)) ? 'fill-current' : 'text-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="text-xs text-slate-600 font-semibold mb-3">
            {isB2B
              ? `Based on ${totalReviews} verified enterprise client engagements`
              : `Based on ${totalReviews} confirmed customer reviews`}
          </div>

          <div className="inline-flex items-center justify-center md:justify-start gap-2 bg-emerald-100/80 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-lg text-xs font-bold w-fit mx-auto md:mx-0">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isB2B
                ? `${recommendPercent}% recommend for enterprise commerce architecture`
                : `${recommendPercent}% would recommend to a friend`}
            </span>
          </div>
        </div>

        {/* Right Column: Star Breakdown Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingCounts[stars] || 0;
            const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
            return (
              <button
                key={stars}
                onClick={() => setFilterRating((prev) => (prev === stars ? 'all' : stars))}
                className={`flex items-center gap-3 text-xs w-full text-left py-0.5 rounded px-2 transition ${
                  filterRating === stars ? 'bg-cyan-50 font-bold' : 'hover:bg-slate-100'
                }`}
              >
                <span className="w-16 font-bold text-slate-700 shrink-0">{stars} Stars</span>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-12 text-right text-slate-500 font-mono shrink-0">
                  {count} ({pct}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" />
          Filter:
        </span>
        <button
          onClick={() => setFilterRating('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
            filterRating === 'all'
              ? 'bg-[#002157] text-[#00e5ff] shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({totalReviews})
        </button>
        {[5, 4, 3].map((star) => (
          <button
            key={star}
            onClick={() => setFilterRating(star)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              filterRating === star
                ? 'bg-[#002157] text-[#00e5ff] shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {star} Stars ({ratingCounts[star] || 0})
          </button>
        ))}
      </div>

      {/* Reviews Cards List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
            No reviews matching this star filter.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 bg-white border border-slate-200 rounded-2xl space-y-3 hover:border-slate-300 transition shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-xs text-slate-900">{rev.author}</span>
                  {rev.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>{isB2B ? 'Verified Enterprise Client' : 'Verified Buyer'}</span>
                    </span>
                  )}
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">{rev.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= rev.rating ? 'fill-current' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{rev.date}</span>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-xs text-slate-900 mb-1">{rev.title}</h5>
                <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <span>{isB2B ? 'Scope: ' : 'Size: '}<strong className="text-slate-800">{rev.sizePurchased}</strong></span>
                  <span>{isB2B ? 'Outcome: ' : 'Fit: '}<strong className="text-emerald-700 font-bold">{rev.fitFeedback}</strong></span>
                </div>

                <button
                  onClick={() => handleVoteHelpful(rev.id)}
                  disabled={helpfulVoted[rev.id]}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] transition ${
                    helpfulVoted[rev.id]
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold cursor-default'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>
                    {helpfulVoted[rev.id] ? 'Helpful (Voted)' : `Helpful (${rev.helpfulCount})`}
                  </span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
