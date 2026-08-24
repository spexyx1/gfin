import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Gift, Coins, ChevronRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

interface OnboardingStep {
  id: string;
  step_name: string;
  completed_at: string | null;
  reward_claimed_at: string | null;
  reward_amount: number;
}

interface OnboardingChecklistProps {
  userId: string;
  onNavigate: (action: string) => void;
}

const STEP_CONFIG = [
  { name: 'create_account', reward: 25, action: '' },
  { name: 'complete_profile', reward: 50, action: 'profile' },
  { name: 'first_listing', reward: 75, action: 'sell' },
  { name: 'first_purchase', reward: 100, action: 'browse' },
];

export default function OnboardingChecklist({ userId, onNavigate }: OnboardingChecklistProps) {
  const { t } = useTranslation();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadSteps();
  }, [userId]);

  async function loadSteps() {
    const { data } = await supabase
      .from('onboarding_steps')
      .select('*')
      .eq('user_id', userId);

    if (data && data.length > 0) {
      setSteps(data);
    } else {
      await initializeSteps();
    }
  }

  async function initializeSteps() {
    const newSteps = STEP_CONFIG.map(step => ({
      user_id: userId,
      step_name: step.name,
      completed_at: step.name === 'create_account' ? new Date().toISOString() : null,
    }));

    const { data } = await supabase
      .from('onboarding_steps')
      .upsert(newSteps, { onConflict: 'user_id,step_name' })
      .select();

    if (data) setSteps(data);
  }

  async function claimReward(stepName: string) {
    setClaiming(stepName);
    const { data, error } = await supabase.rpc('claim_onboarding_reward', {
      p_step_name: stepName,
    });

    if (!error && data?.success) {
      await loadSteps();
    }
    setClaiming(null);
  }

  function getStepLabel(name: string): string {
    switch (name) {
      case 'create_account': return t('onboarding.createAccount', 'Create Account');
      case 'complete_profile': return t('onboarding.completeProfile', 'Complete Profile');
      case 'first_listing': return t('onboarding.firstListing', 'List Your First Item');
      case 'first_purchase': return t('onboarding.firstPurchase', 'Make First Purchase');
      default: return name;
    }
  }

  const completedCount = steps.filter(s => s.completed_at).length;
  const allCompleted = completedCount === STEP_CONFIG.length;
  const allClaimed = steps.every(s => !s.completed_at || s.reward_claimed_at);

  if (dismissed || (allCompleted && allClaimed)) return null;

  const totalRewards = STEP_CONFIG.reduce((sum, s) => sum + s.reward, 0);
  const earnedRewards = steps
    .filter(s => s.reward_claimed_at)
    .reduce((sum, s) => sum + s.reward_amount, 0);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-950/30 to-black/60 backdrop-blur-sm overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              {t('onboarding.title', 'Get Started')}
            </h3>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {t('onboarding.dismiss', 'Dismiss')}
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>{completedCount}/{STEP_CONFIG.length} {t('onboarding.completed', 'completed')}</span>
            <span className="flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" />
              {earnedRewards}/{totalRewards} GHETTO
            </span>
          </div>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / STEP_CONFIG.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="px-3 pb-4 space-y-1">
          {STEP_CONFIG.map((config) => {
            const step = steps.find(s => s.step_name === config.name);
            const isCompleted = step?.completed_at;
            const isClaimed = step?.reward_claimed_at;
            const canClaim = isCompleted && !isClaimed;

            return (
              <div
                key={config.name}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  canClaim
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-gray-300' : 'text-white'}`}>
                    {getStepLabel(config.name)}
                  </p>
                  <p className="text-xs text-amber-400/80 flex items-center gap-1">
                    <Gift className="w-3 h-3" />
                    +{config.reward} GHETTO
                  </p>
                </div>

                {canClaim ? (
                  <button
                    onClick={() => claimReward(config.name)}
                    disabled={claiming === config.name}
                    className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black rounded-lg hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50"
                  >
                    {claiming === config.name ? '...' : t('onboarding.claim', 'Claim')}
                  </button>
                ) : !isCompleted ? (
                  <button
                    onClick={() => onNavigate(config.action)}
                    className="p-1.5 text-gray-500 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : isClaimed ? (
                  <span className="text-xs text-green-500/70 font-medium">
                    {t('onboarding.claimed', 'Claimed')}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
