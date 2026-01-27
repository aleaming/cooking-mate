'use client';

import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { IconCheck, IconX } from '@tabler/icons-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { MonthlyCalendar, RecipeSidebar, DraggableRecipeCard, MealDetailModal, PlacementBanner, FamilyRefreshButton } from '@/components/calendar';
import { WelcomeModal } from '@/components/onboarding';
import { FamilyModeToggle, FamilyContextBanner } from '@/components/family';
import { allRecipes } from '@/data/recipes';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import { useAuth } from '@/providers/AuthProvider';
import { getUserRecipes, getFamilyRecipes } from '@/lib/actions/userRecipes';
import { getFamilyContext } from '@/lib/actions/family';
import { getFamilyMealPlans, proposeFamilyMeal, removeFamilyMeal, checkFamilyMealUpdates } from '@/lib/actions/familyMealPlans';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Recipe, MealSlotType } from '@/types';
import type { FamilyMealPlanWithDetails, FamilyWithDetails, FamilyPermissions, FamilyRole } from '@/types/family';
import { pageVariants } from '@/lib/constants/animations';
import type { SubscriptionTier, SubscriptionStatus } from '@/types/subscription';

// Family context type for the calendar
interface FamilyContextData {
  activeFamily: FamilyWithDetails | null;
  familyModeEnabled: boolean;
  permissions: FamilyPermissions | null;
  role: FamilyRole | null;
}

function CalendarPageContent() {
  const { addMeal, removeMeal, fetchMeals, currentYear, currentMonth } = useMealPlanStore();
  const { user, isLoading: authLoading } = useAuth();
  const hasSeenWelcome = useOnboardingStore((state) => state.hasSeenWelcome);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);
  const hasFetchedRef = useRef<string | null>(null);

  // Family mode state
  const [familyContext, setFamilyContext] = useState<FamilyContextData | null>(null);
  const [familyMealPlans, setFamilyMealPlans] = useState<FamilyMealPlanWithDetails[]>([]);
  const [familyMealsLoading, setFamilyMealsLoading] = useState(false);
  const familyFetchedRef = useRef<string | null>(null);
  const [familyRecipes, setFamilyRecipes] = useState<Array<Recipe & { ownerName: string }>>([]);

  // Family refresh polling state
  const [pendingUpdates, setPendingUpdates] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastRefreshedAtRef = useRef<string>(new Date().toISOString());

  // Meal detail modal state
  const [selectedMeal, setSelectedMeal] = useState<{
    recipe: Recipe;
    date: string;
    mealType: MealSlotType;
    familyMeal?: FamilyMealPlanWithDetails | null;
  } | null>(null);

  // Click-to-place state
  const [placementRecipe, setPlacementRecipe] = useState<(Recipe & { ownerName?: string }) | null>(null);
  const [placementSuccess, setPlacementSuccess] = useState<string | null>(null);
  const isPlacementMode = !!placementRecipe;

  const handleMealClick = useCallback((data: {
    recipe: Recipe;
    date: string;
    mealType: MealSlotType;
    familyMeal?: FamilyMealPlanWithDetails | null;
  }) => {
    setSelectedMeal(data);
  }, []);

  // Click-to-place handlers
  const handleSelectRecipe = useCallback((recipe: Recipe & { ownerName?: string }) => {
    setPlacementRecipe(prev => prev?.id === recipe.id ? null : recipe);
    setPlacementSuccess(null);
  }, []);

  const handleCancelPlacement = useCallback(() => {
    setPlacementRecipe(null);
    setPlacementSuccess(null);
  }, []);

  // Shared helper to refresh family meal plans (DRY)
  const refreshFamilyMeals = useCallback(async () => {
    if (!familyContext?.activeFamily) return;
    const startDate = startOfMonth(new Date(currentYear, currentMonth));
    const endDate = endOfMonth(new Date(currentYear, currentMonth));
    const result = await getFamilyMealPlans({
      familyId: familyContext.activeFamily.id,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      status: 'all',
    });
    if (result.data) {
      setFamilyMealPlans(result.data);
      // Update selectedMeal if it references a family meal that was refreshed
      setSelectedMeal((prev) => {
        if (!prev?.familyMeal) return prev;
        const updated = result.data!.find((m) => m.id === prev.familyMeal!.id);
        return updated ? { ...prev, familyMeal: updated } : prev;
      });
    }
    familyFetchedRef.current = null;
    lastRefreshedAtRef.current = new Date().toISOString();
    setPendingUpdates(0);
  }, [familyContext?.activeFamily, currentYear, currentMonth]);

  // Handle removing a family meal plan
  const handleRemoveFamilyMeal = useCallback(async (mealPlanId: string) => {
    const result = await removeFamilyMeal(mealPlanId);
    if (!result.error) {
      await refreshFamilyMeals();
    }
  }, [refreshFamilyMeals]);

  // Handle placing a recipe via click-to-place
  const handlePlacementSlotClick = useCallback(async (dateString: string, mealType: MealSlotType) => {
    if (!placementRecipe) return;

    if (familyContext?.familyModeEnabled && familyContext?.activeFamily) {
      const result = await proposeFamilyMeal({
        familyId: familyContext.activeFamily.id,
        planDate: dateString,
        mealType,
        recipeId: placementRecipe.id,
        servings: placementRecipe.servings || 4,
      });
      if (result.data) {
        await refreshFamilyMeals();
      }
    } else {
      addMeal(dateString, mealType, placementRecipe);
    }

    setPlacementSuccess(`${dateString}-${mealType}`);
    setTimeout(() => {
      setPlacementRecipe(null);
      setPlacementSuccess(null);
    }, 800);
  }, [placementRecipe, familyContext, addMeal, refreshFamilyMeals]);

  // Handle replacing a rejected family meal with a new recipe
  const handleReplaceMeal = useCallback(async (newRecipe: Recipe) => {
    if (!selectedMeal?.familyMeal || !familyContext?.activeFamily) return;
    await removeFamilyMeal(selectedMeal.familyMeal.id);
    await proposeFamilyMeal({
      familyId: familyContext.activeFamily.id,
      planDate: selectedMeal.date,
      mealType: selectedMeal.mealType,
      recipeId: newRecipe.id,
      servings: newRecipe.servings || 4,
    });
    await refreshFamilyMeals();
    setSelectedMeal(null);
  }, [selectedMeal, familyContext?.activeFamily, refreshFamilyMeals]);

  // Handle subscription success query parameter
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setShowSuccessToast(true);
      // Clear the query param from URL
      router.replace('/calendar', { scroll: false });
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => setShowSuccessToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  // Escape key cancels placement mode
  useEffect(() => {
    if (!isPlacementMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancelPlacement();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isPlacementMode, handleCancelPlacement]);

  // Check subscription status and show welcome modal for new subscribers
  useEffect(() => {
    if (authLoading || !user || hasSeenWelcome) return;

    async function checkSubscription() {
      const supabase = getSupabaseClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_tier')
        .eq('id', user!.id)
        .single();

      if (profile) {
        const status = profile.subscription_status as SubscriptionStatus;
        const tier = profile.subscription_tier as SubscriptionTier | null;

        // Show welcome modal for users with active subscription who haven't seen it
        if ((status === 'active' || status === 'trialing') && tier && !hasSeenWelcome) {
          setSubscriptionTier(tier);
          setShowWelcomeModal(true);
        }
      }
    }

    checkSubscription();
  }, [user, authLoading, hasSeenWelcome]);

  // Load family context when user is authenticated
  useEffect(() => {
    if (authLoading || !user) {
      setFamilyContext(null);
      setFamilyMealPlans([]);
      return;
    }

    async function loadFamilyContext() {
      const result = await getFamilyContext();
      if (result.data) {
        setFamilyContext(result.data);
      } else {
        setFamilyContext(null);
      }
    }

    loadFamilyContext();
  }, [user, authLoading]);

  // Load family meal plans when in family mode and month changes
  useEffect(() => {
    if (!familyContext?.familyModeEnabled || !familyContext?.activeFamily) {
      setFamilyMealPlans([]);
      return;
    }

    const fetchKey = `family-${familyContext.activeFamily.id}-${currentYear}-${currentMonth}`;
    if (familyFetchedRef.current === fetchKey) return;

    async function loadFamilyMeals() {
      if (!familyContext?.activeFamily) return;

      setFamilyMealsLoading(true);
      const startDate = startOfMonth(new Date(currentYear, currentMonth));
      const endDate = endOfMonth(new Date(currentYear, currentMonth));

      const result = await getFamilyMealPlans({
        familyId: familyContext.activeFamily.id,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        status: 'all',
      });

      if (result.data) {
        setFamilyMealPlans(result.data);
      }
      setFamilyMealsLoading(false);
      familyFetchedRef.current = fetchKey;
    }

    loadFamilyMeals();
  }, [familyContext?.familyModeEnabled, familyContext?.activeFamily, currentYear, currentMonth]);

  // Fetch meal plans from Supabase when user is authenticated and month changes
  useEffect(() => {
    // Don't fetch until auth state is determined
    if (authLoading) return;

    // Don't fetch if not logged in
    if (!user) return;

    // Create a key to track what we've fetched
    const fetchKey = `${currentYear}-${currentMonth}-${user.id}`;

    // Don't re-fetch if we already fetched for this month/user combo
    if (hasFetchedRef.current === fetchKey) return;

    const startDate = startOfMonth(new Date(currentYear, currentMonth));
    const endDate = endOfMonth(new Date(currentYear, currentMonth));

    fetchMeals(
      format(startDate, 'yyyy-MM-dd'),
      format(endDate, 'yyyy-MM-dd')
    );

    hasFetchedRef.current = fetchKey;
  }, [user, authLoading, currentYear, currentMonth, fetchMeals]);

  // Fetch user recipes when logged in (wait for auth to finish loading first)
  useEffect(() => {
    async function fetchUserRecipes() {
      // Don't fetch until auth state is determined
      if (authLoading) return;

      if (!user) {
        setUserRecipes([]);
        return;
      }

      const { data, error } = await getUserRecipes();
      if (error) {
        console.error('Failed to fetch user recipes:', error);
        return;
      }
      if (data) {
        // Convert UserRecipe to Recipe type (they're compatible)
        setUserRecipes(data as Recipe[]);
      }
    }

    fetchUserRecipes();
  }, [user, authLoading]);

  // Fetch family members' recipes when in family mode
  useEffect(() => {
    if (!familyContext?.familyModeEnabled || !familyContext?.activeFamily) {
      setFamilyRecipes([]);
      return;
    }

    async function loadFamilyRecipes() {
      if (!familyContext?.activeFamily) return;
      const result = await getFamilyRecipes(familyContext.activeFamily.id);
      if (result.data) {
        setFamilyRecipes(result.data);
      }
    }

    loadFamilyRecipes();
  }, [familyContext?.familyModeEnabled, familyContext?.activeFamily]);

  // Manual refresh handler for the FamilyRefreshButton
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshFamilyMeals();
    setIsRefreshing(false);
  }, [refreshFamilyMeals]);

  // Poll for family meal plan updates (30s interval, visibility-aware)
  useEffect(() => {
    if (!familyContext?.familyModeEnabled || !familyContext?.activeFamily) return;

    const familyId = familyContext.activeFamily.id;

    const poll = async () => {
      if (document.hidden) return;

      const sd = format(startOfMonth(new Date(currentYear, currentMonth)), 'yyyy-MM-dd');
      const ed = format(endOfMonth(new Date(currentYear, currentMonth)), 'yyyy-MM-dd');

      const result = await checkFamilyMealUpdates({
        familyId,
        startDate: sd,
        endDate: ed,
        since: lastRefreshedAtRef.current,
      });

      if (result.data) {
        const total = result.data.mealChanges + result.data.voteChanges;
        setPendingUpdates(total);
      }
    };

    const interval = setInterval(poll, 30_000);

    // Also poll immediately when returning to the tab
    const handleVisibility = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [familyContext?.familyModeEnabled, familyContext?.activeFamily, currentYear, currentMonth]);

  // Combine static recipes with user recipes and family recipes
  const combinedRecipes = useMemo(() => {
    const base = [...allRecipes, ...userRecipes];
    if (familyRecipes.length > 0) {
      const existingIds = new Set(base.map((r) => r.id));
      for (const fr of familyRecipes) {
        if (!existingIds.has(fr.id)) {
          base.push(fr);
        }
      }
    }
    return base;
  }, [userRecipes, familyRecipes]);

  // O(1) recipe lookup map for calendar components
  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of combinedRecipes) {
      map.set(r.id, r);
    }
    return map;
  }, [combinedRecipes]);

  // Configure sensors with touch-friendly activation constraints
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 10, // Increased from 8 for better touch handling
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // Add delay to distinguish from scroll
      tolerance: 5,
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const recipe = active.data.current?.recipe as Recipe | undefined;
    if (recipe) {
      setActiveRecipe(recipe);
      // Close mobile drawer when starting to drag
      setIsMobileDrawerOpen(false);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setActiveDropId(over.id as string);
    } else {
      setActiveDropId(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveRecipe(null);
      setActiveDropId(null);

      if (!over) return;

      const recipe = active.data.current?.recipe as Recipe | undefined;
      const dropData = over.data.current as { dateString: string; mealType: MealSlotType } | undefined;

      if (recipe && dropData) {
        // If in family mode, create a family meal plan
        if (familyContext?.familyModeEnabled && familyContext?.activeFamily) {
          const result = await proposeFamilyMeal({
            familyId: familyContext.activeFamily.id,
            planDate: dropData.dateString,
            mealType: dropData.mealType,
            recipeId: recipe.id,
            servings: recipe.servings || 4,
          });

          if (result.data) {
            await refreshFamilyMeals();
          }
        } else {
          // Personal meal plan
          addMeal(dropData.dateString, dropData.mealType, recipe);
        }
      }
    },
    [addMeal, familyContext, currentYear, currentMonth, refreshFamilyMeals]
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-[calc(100vh-64px)] flex flex-col lg:flex-row"
    >
      {/* Subscription Success Toast */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50
                       bg-olive-500 text-white px-6 py-4 rounded-2xl
                       shadow-lg shadow-olive-500/30 flex items-center gap-3"
          >
            <IconCheck size={24} />
            <div>
              <p className="font-semibold">Welcome to MedDiet!</p>
              <p className="text-sm text-olive-100">Your subscription is now active.</p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="ml-2 p-1 hover:bg-olive-600 rounded-lg transition-colors"
              aria-label="Dismiss"
            >
              <IconX size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Desktop Recipe Sidebar - hidden on mobile */}
        <div className="hidden lg:block w-72 flex-shrink-0 h-[calc(100vh-64px)] sticky top-16">
          <RecipeSidebar
            recipes={combinedRecipes}
            selectedRecipeId={placementRecipe?.id}
            onSelectRecipe={handleSelectRecipe}
          />
        </div>

        {/* Calendar Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto bg-sand-50">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-olive-900">
                    Meal Planner
                  </h1>
                  <p className="text-sand-600 mt-1 text-sm sm:text-base">
                    <span className="hidden sm:inline">Click or drag recipes from the sidebar to plan your meals</span>
                    <span className="sm:hidden">Tap the + button to add recipes</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {familyContext?.familyModeEnabled && (
                    <FamilyRefreshButton
                      updateCount={pendingUpdates}
                      isRefreshing={isRefreshing}
                      onRefresh={handleManualRefresh}
                    />
                  )}
                  <FamilyModeToggle />
                </div>
              </div>

              {/* Family Context Banner */}
              <FamilyContextBanner className="mt-3" />
            </div>

            {/* Placement Banner */}
            <PlacementBanner
              recipe={placementRecipe}
              onCancel={handleCancelPlacement}
            />

            {/* Calendar */}
            <MonthlyCalendar
              activeDropId={activeDropId}
              familyModeEnabled={familyContext?.familyModeEnabled || false}
              familyId={familyContext?.activeFamily?.id}
              familyMealPlans={familyMealPlans}
              recipeMap={recipeMap}
              onMealClick={handleMealClick}
              onRemoveFamilyMeal={handleRemoveFamilyMeal}
              isPlacementMode={isPlacementMode}
              onPlacementSlotClick={handlePlacementSlotClick}
              placementSuccess={placementSuccess}
            />

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-sand-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-terracotta-100 border border-terracotta-200" />
                <span>Breakfast</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-aegean-100 border border-aegean-200" />
                <span>Lunch</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-olive-100 border border-olive-200" />
                <span>Dinner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Floating Action Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
          onClick={() => setIsMobileDrawerOpen(true)}
          className="
            lg:hidden fixed right-4 bottom-4 z-40
            w-14 h-14 rounded-full
            bg-olive-500 text-white shadow-lg shadow-olive-500/30
            flex items-center justify-center
            active:scale-95 transition-transform
          "
          aria-label="Add recipe to meal plan"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.button>

        {/* Mobile Recipe Drawer */}
        <AnimatePresence>
          {isMobileDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileDrawerOpen(false)}
                className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              />

              {/* Drawer */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="lg:hidden fixed inset-x-0 bottom-0 z-50 h-[80vh] bg-white rounded-t-3xl shadow-2xl overflow-hidden"
              >
                {/* Drag Handle */}
                <button
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="flex justify-center w-full py-3"
                  aria-label="Close drawer"
                >
                  <div className="w-12 h-1.5 rounded-full bg-sand-300" />
                </button>

                {/* Header with Close Button */}
                <div className="flex items-center justify-between px-4 pb-3 border-b border-sand-200">
                  <h2 className="font-display text-lg font-semibold text-olive-900">
                    Select a Recipe
                  </h2>
                  <button
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-sand-100 active:bg-sand-200 transition-colors -mr-2"
                    aria-label="Close"
                  >
                    <svg
                      className="w-5 h-5 text-sand-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Instruction */}
                <div className="px-4 py-2 bg-olive-50 border-b border-olive-100">
                  <p className="text-sm text-olive-700">
                    Tap a recipe, then tap a meal slot on the calendar
                  </p>
                </div>

                {/* Recipe List */}
                <div className="flex-1 overflow-hidden h-[calc(80vh-120px)]">
                  <RecipeSidebar
                    recipes={combinedRecipes}
                    selectedRecipeId={placementRecipe?.id}
                    onSelectRecipe={(recipe) => {
                      handleSelectRecipe(recipe);
                      setIsMobileDrawerOpen(false);
                    }}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeRecipe && (
            <div className="opacity-90">
              <DraggableRecipeCard recipe={activeRecipe} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Welcome Modal for new subscribers */}
      {subscriptionTier && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
          tier={subscriptionTier}
        />
      )}

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <MealDetailModal
          isOpen={!!selectedMeal}
          onClose={() => setSelectedMeal(null)}
          recipe={selectedMeal.recipe}
          date={selectedMeal.date}
          mealType={selectedMeal.mealType}
          familyMeal={selectedMeal.familyMeal}
          onRemove={() => {
            if (selectedMeal.familyMeal) {
              removeFamilyMeal(selectedMeal.familyMeal.id).then(() => refreshFamilyMeals());
            } else {
              removeMeal(selectedMeal.date, selectedMeal.mealType);
            }
          }}
          onVoteSuccess={refreshFamilyMeals}
          onReplaceMeal={handleReplaceMeal}
          recipes={combinedRecipes}
        />
      )}
    </motion.div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-sand-50" />}>
      <CalendarPageContent />
    </Suspense>
  );
}
