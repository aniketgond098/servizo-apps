import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { DB } from '../services/db';
import { AuthService } from '../services/auth';
import { Booking, Specialist, Review } from '../types';

export default function ReviewPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    if (!bookingId) { navigate('/dashboard'); return; }

    const load = async () => {
      const allBookings = await DB.getBookings();
      const b = allBookings.find(bk => bk.id === bookingId);
      if (!b || b.userId !== currentUser.id || b.status !== 'completed') {
        navigate('/dashboard');
        return;
      }
      setBooking(b);

      const specialists = await DB.getSpecialists();
      const sp = specialists.find(s => s.id === b.specialistId);
      if (sp) setSpecialist(sp);

      const existing = await DB.getReviewByBookingAndUser(bookingId, currentUser.id);
      if (existing) setExistingReview(existing);

      setLoading(false);
    };
    load();
  }, [bookingId]);

  const handleSubmit = async () => {
    if (!currentUser || !booking || !specialist || existingReview) return;
    setSubmitting(true);
    await DB.createReview({
      bookingId: booking.id,
      specialistId: booking.specialistId,
      userId: currentUser.id,
      rating,
      comment
    });
    await DB.updateBooking({ ...booking, reviewed: true });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#000000] rounded-full animate-spin"></div>
      </div>
    );
  }

  // Already reviewed
  if (existingReview) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-[#4169E1]" />
          </div>
          <h2 className="text-xl font-bold text-[#000000] mb-2">Already Reviewed</h2>
          <p className="text-sm text-gray-500 mb-2">You've already submitted a review for this booking.</p>
          <div className="flex justify-center gap-0.5 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-5 h-5 ${s <= existingReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
            ))}
          </div>
          {existingReview.comment && (
            <p className="text-sm text-gray-600 italic mb-5">"{existingReview.comment}"</p>
          )}
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#000000] text-white rounded-lg text-sm font-semibold hover:bg-[#1a1a1a] transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#000000] mb-2">Thank You!</h2>
          <p className="text-sm text-gray-500 mb-6">Your review has been submitted. It helps {specialist?.name} and other users on Servizo.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#000000] text-white rounded-lg text-sm font-semibold hover:bg-[#1a1a1a] transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-64px)]">
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#000000] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#000000] to-[#2d4a7a] p-6 text-center text-white">
            <h1 className="text-xl font-bold mb-1">Rate Your Experience</h1>
            <p className="text-sm text-blue-200">Your feedback helps improve our community</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Specialist info */}
            {specialist && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <img src={specialist.avatar} alt={specialist.name} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                <div>
                  <h3 className="font-semibold text-[#000000]">{specialist.name}</h3>
                  <p className="text-xs text-[#4169E1] font-medium">{specialist.category} Specialist</p>
                  <p className="text-xs text-gray-400 mt-0.5">Booking {booking?.id} · {booking?.completedAt ? new Date(booking.completedAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
            )}

            {/* Star rating */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600 mb-3">How would you rate the service?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoveredRating(s)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star className={`w-10 h-10 transition-colors ${
                      s <= (hoveredRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
                    }`} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Below Average'}
                {rating === 3 && 'Average'}
                {rating === 4 && 'Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Tell us more (optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-[#4169E1] focus:ring-1 focus:ring-[#4169E1]/20 resize-none"
                placeholder="What went well? What could be improved?"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-[#000000] text-white rounded-xl font-semibold text-sm hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 text-gray-500 text-sm font-medium hover:text-[#000000] transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
