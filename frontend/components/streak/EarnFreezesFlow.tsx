'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Snowflake, Check, X, ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/queryKeys';
import { useStreakQuizNext } from '@/hooks/streak/useStreakQuizNext';
import { useStreakQuizAnswer } from '@/hooks/streak/useStreakQuizAnswer';

const MAX_FREEZES = 5;

interface EarnFreezesFlowProps {
  freezesAvailable: number;
  onClose: () => void;
}

export function EarnFreezesFlow({
  freezesAvailable: initialFreezes,
  onClose,
}: EarnFreezesFlowProps) {
  const queryClient = useQueryClient();
  const [freezeCount, setFreezeCount] = useState(initialFreezes);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<{
    correct: boolean;
    correctAnswerIndex: number;
    freezeEarned: boolean;
  } | null>(null);

  const { data: quizData, isLoading } = useStreakQuizNext({
    enabled: freezeCount < MAX_FREEZES,
  });

  const answerMutation = useStreakQuizAnswer();

  const handleSubmit = useCallback(() => {
    if (selectedAnswer === null || !quizData?.question) return;

    answerMutation.mutate(
      { questionId: quizData.question.id, answerIndex: selectedAnswer },
      {
        onSuccess: (result) => {
          setLastResult(result);
          if (result.freezeEarned) {
            setFreezeCount(result.freezesAvailable);
          }
        },
      },
    );
  }, [selectedAnswer, quizData, answerMutation]);

  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setLastResult(null);
    // Invalidate to re-fetch — backend tracks answered questions server-side
    void queryClient.invalidateQueries({ queryKey: queryKeys.streak.quiz });
  }, [queryClient]);

  // Freeze slots visualization
  const slots = Array.from({ length: MAX_FREEZES }, (_, i) => i < freezeCount);

  // Done state: all slots filled or no more questions
  if (freezeCount >= MAX_FREEZES || (quizData?.done && !lastResult)) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center gap-2">
          {slots.map((filled, i) => (
            <motion.div
              key={i}
              initial={i === freezeCount - 1 ? { scale: 0 } : false}
              animate={{ scale: 1 }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                filled
                  ? 'bg-cyan-500/20 border border-cyan-400/40'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <Snowflake
                className={`w-5 h-5 ${filled ? 'text-cyan-400' : 'text-white/20'}`}
              />
            </motion.div>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">
            {freezeCount >= MAX_FREEZES
              ? 'All slots filled!'
              : 'No more questions!'}
          </h3>
          <p className="text-white/60 text-sm mt-1">
            You have {freezeCount} {freezeCount === 1 ? 'freeze' : 'freezes'}{' '}
            ready.
          </p>
        </div>
        <Button variant="outline" onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading || !quizData?.question) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-white/20 border-t-spotify-green rounded-full animate-spin" />
      </div>
    );
  }

  const question = quizData.question;

  return (
    <div className="space-y-5">
      {/* Header with freeze slots */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-1.5">
          {slots.map((filled, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded flex items-center justify-center ${
                filled
                  ? 'bg-cyan-500/20 border border-cyan-400/40'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <Snowflake
                className={`w-3.5 h-3.5 ${filled ? 'text-cyan-400' : 'text-white/20'}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Question */}
      <div>
        <span className="text-xs text-white/40 uppercase tracking-wider">
          {question.category}
        </span>
        <h3 className="text-lg font-semibold text-white mt-1">
          {question.question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <AnimatePresence mode="wait">
          {question.options.map((option, idx) => {
            let optionStyle =
              'border-white/15 hover:border-white/30 bg-white/5';

            if (lastResult) {
              if (idx === lastResult.correctAnswerIndex) {
                optionStyle = 'border-green-400/60 bg-green-400/10';
              } else if (idx === selectedAnswer && !lastResult.correct) {
                optionStyle = 'border-red-400/60 bg-red-400/10';
              } else {
                optionStyle = 'border-white/10 bg-white/3 opacity-50';
              }
            } else if (selectedAnswer === idx) {
              optionStyle = 'border-spotify-green/60 bg-spotify-green/10';
            }

            return (
              <motion.button
                key={idx}
                layout
                onClick={() => !lastResult && setSelectedAnswer(idx)}
                disabled={!!lastResult}
                className={`w-full p-3.5 rounded-xl border text-left transition-colors text-sm ${optionStyle}`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-white/40 font-mono text-xs w-4">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-white">{option}</span>
                  {lastResult && idx === lastResult.correctAnswerIndex && (
                    <Check className="w-4 h-4 text-green-400 ml-auto" />
                  )}
                  {lastResult &&
                    idx === selectedAnswer &&
                    !lastResult.correct && (
                      <X className="w-4 h-4 text-red-400 ml-auto" />
                    )}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Action button */}
      {!lastResult ? (
        <Button
          variant="spotify"
          className="w-full"
          onClick={handleSubmit}
          disabled={selectedAnswer === null || answerMutation.isPending}
        >
          {answerMutation.isPending ? 'Checking...' : 'Submit'}
        </Button>
      ) : (
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-3 text-center text-sm font-medium ${
              lastResult.correct
                ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                : 'bg-red-400/10 text-red-400 border border-red-400/20'
            }`}
          >
            {lastResult.correct
              ? lastResult.freezeEarned
                ? 'Correct! Freeze earned!'
                : 'Correct! (Freezes already full)'
              : 'Wrong answer!'}
          </motion.div>
          <Button variant="outline" className="w-full" onClick={handleNext}>
            {freezeCount >= MAX_FREEZES ? 'Done' : 'Next question'}
          </Button>
        </div>
      )}
    </div>
  );
}
