// app/vote/page.tsx — v7 fixed guided flow with voterInfo preserved
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VoteFormState, VoterInfo, CategoryRecord, EmployeeRecord, RatingMap } from "@/types";
import StepIndicator from "@/components/voting/StepIndicator";
import StepVoterInfo from "@/components/voting/StepVoterInfo";
import StepCategory from "@/components/voting/StepCategory";
import StepEmployee from "@/components/voting/StepEmployee";
import StepRating from "@/components/voting/StepRating";
import StepSubmit from "@/components/voting/StepSubmit";
import SuccessScreen from "@/components/voting/SuccessScreen";
import AlexonHeader from "@/components/ui/AlexonHeader";

const INITIAL_STATE: VoteFormState = {
  step: 1,
  voterInfo: null,
  selectedCategory: null,
  selectedCandidate: null,
  ratings: {},
  comment: "",
};

type SuccessState = {
  step: "success";
  candidateName: string;
  categoryName: string;
  voterEmployeeId: string;
  // Keep voterInfo so we can restore it
  voterInfo: VoterInfo;
};

type PageState = VoteFormState | SuccessState;

export default function VotePage() {
  const [state, setState] = useState<PageState>(INITIAL_STATE);

  const updateStep = useCallback((newState: Partial<VoteFormState>) => {
    setState(prev => ({ ...prev, ...newState } as VoteFormState));
  }, []);

  const goToStep = useCallback((step: 1 | 2 | 3 | 4 | 5) => {
    setState(prev => ({ ...prev, step } as VoteFormState));
  }, []);

  // Called after a successful vote — preserve voterInfo in success state
  const handleSuccess = useCallback((candidateName: string) => {
    const fs = state as VoteFormState;
    setState({
      step: "success",
      candidateName,
      categoryName: fs.selectedCategory?.name ?? "",
      voterEmployeeId: fs.voterInfo?.employeeId ?? "",
      voterInfo: fs.voterInfo!, // preserve for next category
    });
  }, [state]);

  // Full restart
  const handleRestart = useCallback(() => setState(INITIAL_STATE), []);

  // Go to next category — restore voterInfo and jump to category selection
  const handleNextCategory = useCallback((categoryId: string, categoryName: string) => {
    // Get voterInfo from the success state
    const successState = state as SuccessState;
    const voterInfo = successState.voterInfo;

    setState({
      step: 2, // Go to category selection
      voterInfo, // Restore voter info
      selectedCategory: null,
      selectedCandidate: null,
      ratings: {},
      comment: "",
    } as VoteFormState);
  }, [state]);

  if (state.step === "success") {
    const successState = state as SuccessState;
    return (
      <SuccessScreen
        candidateName={successState.candidateName}
        categoryName={successState.categoryName}
        voterEmployeeId={successState.voterEmployeeId}
        onRestart={handleRestart}
        onNextCategory={handleNextCategory}
      />
    );
  }

  const formState = state as VoteFormState;
  const STEPS = ["Verify", "Category", "Candidate", "Rate", "Submit"];
  const isLeaderCategory = formState.selectedCategory?.name?.toLowerCase().includes("leader") ?? false;

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="h-[2px] bg-gold-gradient" />
      <AlexonHeader />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        <StepIndicator
          currentStep={formState.step}
          steps={STEPS}
          onStepClick={goToStep}
          completedSteps={formState.step - 1}
        />

        <div className="mt-10">
          <AnimatePresence mode="wait">
            {formState.step === 1 && (
              <motion.div key="s1"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <StepVoterInfo
                  voterInfo={formState.voterInfo}
                  onChange={(v: VoterInfo) => updateStep({ voterInfo: v })}
                  onNext={() => goToStep(2)}
                />
              </motion.div>
            )}

            {formState.step === 2 && (
              <motion.div key="s2"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <StepCategory
                  selectedCategory={formState.selectedCategory}
                  voterEmployeeId={formState.voterInfo?.employeeId ?? ""}
                  onChange={(c: CategoryRecord) => updateStep({ selectedCategory: c, selectedCandidate: null, ratings: {} })}
                  onNext={() => goToStep(3)}
                  onBack={() => goToStep(1)}
                />
              </motion.div>
            )}

            {formState.step === 3 && (
              <motion.div key="s3"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <StepEmployee
                  category={formState.selectedCategory!}
                  voterEmployeeId={formState.voterInfo?.employeeId ?? ""}
                  selectedCandidate={formState.selectedCandidate}
                  onChange={(e: EmployeeRecord) => updateStep({ selectedCandidate: e })}
                  onNext={() => goToStep(4)}
                  onBack={() => goToStep(2)}
                />
              </motion.div>
            )}

            {formState.step === 4 && (
              <motion.div key="s4"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <StepRating
                  category={isLeaderCategory ? "TEAM_LEADER" : "BLOCK_CABROS_PRODUCTION"}
                  candidate={formState.selectedCandidate!}
                  ratings={formState.ratings}
                  comment={formState.comment}
                  onRatingsChange={(r: RatingMap) => updateStep({ ratings: r })}
                  onCommentChange={(c: string) => updateStep({ comment: c })}
                  onNext={() => goToStep(5)}
                  onBack={() => goToStep(3)}
                />
              </motion.div>
            )}

            {formState.step === 5 && (
              <motion.div key="s5"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <StepSubmit
                  formState={formState}
                  onBack={() => goToStep(4)}
                  onSuccess={handleSuccess}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
