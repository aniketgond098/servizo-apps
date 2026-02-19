import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, X, Phone, Video, MessageSquare } from 'lucide-react';
import { DB } from '../services/db';
import { AuthService } from '../services/auth';

interface Props {
  callId: string;
  toUserId: string;
  toUserName: string;
  callType: 'voice' | 'video';
  callDuration: number;
  onClose: () => void;
}

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(i)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-5 h-5 transition-colors ${
                i <= (hovered || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CallFeedbackModal({ callId, toUserId, toUserName, callType, callDuration, onClose }: Props) {
  const [overallRating, setOverallRating] = useState(0);
  const [languageRating, setLanguageRating] = useState(0);
  const [behaviourRating, setBehaviourRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentUser = AuthService.getCurrentUser();

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!currentUser || overallRating === 0) return;
    setSubmitting(true);
    await DB.saveCallFeedback({
      callId,
      fromUserId: currentUser.id,
      toUserId,
      toUserName,
      callType,
      callDuration,
      overallRating,
      languageRating: languageRating || overallRating,
      behaviourRating: behaviourRating || overallRating,
      wouldRecommend: wouldRecommend ?? true,
      comment,
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 1800);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-[340px] text-center animate-in fade-in zoom-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ThumbsUp className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Thanks for your feedback!</h3>
          <p className="text-sm text-gray-500">Your review helps others find great workers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-t-3xl p-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center mx-auto mb-3 text-white text-xl font-bold shadow-lg">
            {toUserName.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-white font-semibold text-base">{toUserName}</h3>
          <div className="flex items-center justify-center gap-2 mt-1">
            {callType === 'video' ? <Video className="w-3.5 h-3.5 text-white/60" /> : <Phone className="w-3.5 h-3.5 text-white/60" />}
            <span className="text-white/60 text-xs">{callType === 'video' ? 'Video' : 'Voice'} call · {formatDuration(callDuration)}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-center text-sm text-gray-500">How was your call experience?</p>

          {/* Star ratings */}
          <div className="space-y-3.5">
            <StarRow label="Overall experience" value={overallRating} onChange={setOverallRating} />
            <StarRow label="Language & communication" value={languageRating} onChange={setLanguageRating} />
            <StarRow label="Behaviour & attitude" value={behaviourRating} onChange={setBehaviourRating} />
          </div>

          {/* Would recommend */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Would you recommend this worker?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setWouldRecommend(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  wouldRecommend === true ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <ThumbsUp className="w-4 h-4" /> Yes
              </button>
              <button
                onClick={() => setWouldRecommend(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  wouldRecommend === false ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <ThumbsDown className="w-4 h-4" /> No
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <p className="text-sm text-gray-600">Additional comments (optional)</p>
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:border-gray-400 transition-colors"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={overallRating === 0 || submitting}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting...' : overallRating === 0 ? 'Select a rating to submit' : 'Submit Feedback'}
          </button>

          <button onClick={onClose} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
