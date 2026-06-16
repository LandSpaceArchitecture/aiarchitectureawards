import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "motion/react";
import { Check, ChevronRight, ChevronLeft, Upload, X, Video, CreditCard, Loader2, LogIn, Award, Globe, Info, FileText, Camera, ArrowRight } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { cn, compressImage } from "@/src/lib/utils";
import { CATEGORIES, COUNTRIES } from "@/src/constants";
import { submissionService } from "@/src/services/submissionService";
import { useAuth } from "@/src/contexts/AuthContext";

const submissionSchema = z.object({
  projectTitle: z.string().min(3, "Project title is required"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  shortDescription: z.string()
    .min(10, "Short description is too short")
    .refine((val) => val.trim().split(/\s+/).length <= 150, "Short description must be under 150 words"),
  aiApproach: z.string()
    .min(20, "AI approach description is required")
    .refine((val) => val.trim().split(/\s+/).length <= 200, "AI approach manifesto must be under 200 words"),
  authorName: z.string().min(2, "Author name is required"),
  email: z.string().email("Invalid email address"),
  country: z.string().min(1, "Country is required"),
  otherCredits: z.string().max(500, "Other credits must be under 500 characters").optional(),
  videoUrl: z.string().url("Invalid video URL").optional().or(z.literal("")),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

export default function Submit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, supabaseUser, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1); // 1: Details (1-4), 2: Review & Payment (5)
  
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const sessionId = searchParams.get("session_id");
    const canceled = searchParams.get("canceled");

    if (success) {
      setIsPaid(true);
      setCurrentStep(2);

      // Idempotency guard: don't process the same Stripe session twice
      // (covers: page reload, browser back/forward, React StrictMode double-effect)
      const processedKey = `submission_processed_${sessionId || "unknown"}`;
      if (sessionStorage.getItem(processedKey)) {
        console.log("[SUBMIT] Already processed this Stripe session, skipping.");
        setIsSubmitting(false);
        setIsSuccess(true);
        return;
      }

      setIsSubmitting(true);
      setUploadStatus("Restoring submission...");
      try {
        const saved = sessionStorage.getItem("submission_draft");
        if (saved) {
          // Mark this session as being processed BEFORE the async call
          sessionStorage.setItem(processedKey, "1");
          const draft = JSON.parse(saved);
          const imageUrls: string[] = draft._imageUrls || [];
          const savedUid: string | undefined = draft._uid;
          delete draft._imageUrls;
          delete draft._uid;
          Object.entries(draft).forEach(([key, value]) => {
            setValue(key as any, value as any);
          });
          if (imageUrls.length > 0) {
            // Use the uid saved before redirect — no need to wait for auth API
            finishSubmissionAfterPayment(imageUrls, draft, savedUid);
          } else {
            setIsSubmitting(false);
            setSubmissionError("Payment received, but image data was lost. Please contact support with your payment receipt.");
          }
        } else {
          setIsSubmitting(false);
          setSubmissionError("Payment received, but submission draft was lost (browser session cleared). Please contact support.");
        }
      } catch (e) {
        console.error("Could not restore draft:", e);
        setIsSubmitting(false);
        setSubmissionError("Payment received, but submission failed to finalize. Please contact support.");
      }
    }

    if (canceled) {
      setSubmissionError("Payment was canceled. You can try again when you're ready.");
      setCurrentStep(2);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      categories: searchParams.get("category") ? [searchParams.get("category")!] : [],
      projectTitle: "",
      shortDescription: "",
      aiApproach: "",
      authorName: user?.displayName || supabaseUser?.user_metadata?.full_name || supabaseUser?.email?.split('@')[0] || "",
      email: user?.email || supabaseUser?.email || "",
      country: "",
      otherCredits: "",
      videoUrl: "",
    },
  });

  useEffect(() => {
    if (user || supabaseUser) {
      setValue("authorName", user?.displayName || supabaseUser?.user_metadata?.full_name || supabaseUser?.email?.split('@')[0] || "");
      setValue("email", user?.email || supabaseUser?.email || "");
    }
  }, [user, supabaseUser, setValue]);

  const selectedCategories = watch("categories");

  // Cover Image Dropzone
  const onDropCover = (acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      alert("File is too large. Max size is 4MB.");
      return;
    }
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps, isDragActive: isCoverDragActive } = useDropzone({
    onDrop: onDropCover,
    accept: { "image/*": [] },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
    multiple: false,
  } as any);

  // Gallery Dropzone
  const onDropGallery = (acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      alert("Some files were too large. Max size is 4MB per image.");
    }
    const newImages = [...galleryImages, ...acceptedFiles].slice(0, 5);
    setGalleryImages(newImages);
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setGalleryPreviews(newPreviews);
  };

  const { getRootProps: getGalleryRootProps, getInputProps: getGalleryInputProps, isDragActive: isGalleryDragActive } = useDropzone({
    onDrop: onDropGallery,
    accept: { "image/*": [] },
    maxFiles: 5,
    maxSize: 4 * 1024 * 1024,
    multiple: true,
  } as any);

  const removeGalleryImage = (index: number) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(newImages);
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryPreviews(newPreviews);
  };

  const nextStep = async () => {
    if (currentStep === 1) {
      const isFormValid = await trigger();
      const isImagesValid = !!coverImage;
      
      if (isFormValid && isImagesValid) {
        setCurrentStep(2);
        window.scrollTo(0, 0);
      } else if (!isImagesValid) {
        alert("Cover image is required.");
      }
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
    window.scrollTo(0, 0);
  };

  const calculateTotal = () => {
    return calculateTotalForCategories(selectedCategories);
  };

  // Pure function — takes categories explicitly, doesn't depend on form state.
  // Used in finishSubmissionAfterPayment where form state may not be ready yet.
  const calculateTotalForCategories = (categories: string[]) => {
    if (!categories || categories.length === 0) return 0;

    const now = new Date();
    const earlyDeadline = new Date("2026-07-04");
    const standardDeadline = new Date("2026-07-16");
    const lateDeadline = new Date("2026-07-30");

    let baseEntryFee = 30;
    if (now <= earlyDeadline) baseEntryFee = 20;
    else if (now <= standardDeadline) baseEntryFee = 30;
    else if (now <= lateDeadline) baseEntryFee = 40;

    const categoryPrices = categories.map(catId =>
      catId === 'animation' ? 35 : baseEntryFee
    );
    const firstCategoryPrice = categoryPrices.length > 0 ? Math.max(...categoryPrices) : 0;
    const additionalPrice = (categories.length - 1) * 10;
    return firstCategoryPrice + additionalPrice;
  };

  const getEntryType = () => {
    const now = new Date();
    const earlyDeadline = new Date("2026-07-04");
    const standardDeadline = new Date("2026-07-16");
    const lateDeadline = new Date("2026-07-30");
    
    if (now <= earlyDeadline) return "Early Entry";
    if (now <= standardDeadline) return "Standard Entry";
    if (now <= lateDeadline) return "Late Entry";
    return "Final Entry";
  };

  const handlePayment = async () => {
    const isFormValid = await trigger();
    if (!isFormValid || !coverImage) {
      alert("Please complete all required fields and upload a cover image first.");
      return;
    }

    // Validate image sizes before starting (raw, pre-compression)
    const allFilesRaw = [coverImage, ...galleryImages];
    const oversizedFiles = allFilesRaw.filter(file => file.size > 15 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setSubmissionError(`One or more images are too large (${(oversizedFiles[0].size / 1024 / 1024).toFixed(2)}MB). Please use files under 15MB.`);
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // 1. Compress images
      setUploadStatus("Optimizing images...");
      setUploadProgress(5);
      const compressedCover = await compressImage(coverImage);
      setUploadProgress(15);

      const compressedGallery = await Promise.all(
        galleryImages.map(async (img, idx) => {
          const compressed = await compressImage(img);
          setUploadProgress(15 + ((idx + 1) / Math.max(1, galleryImages.length)) * 10);
          return compressed;
        })
      );
      const allFiles = [compressedCover, ...compressedGallery];

      // 2. Upload to Supabase Storage BEFORE payment redirect
      setUploadStatus(`Uploading ${allFiles.length} image${allFiles.length > 1 ? "s" : ""}...`);
      const allUrls = await submissionService.uploadProjectImages(
        allFiles,
        watch("projectTitle"),
        (progress) => {
          setUploadProgress(25 + progress * 0.6);
        }
      );
      setUploadProgress(85);

      // 3. Persist form data + uploaded URLs + user ID so they survive the Stripe redirect
      const formSnapshot = watch();
      sessionStorage.setItem(
        "submission_draft",
        JSON.stringify({
          ...formSnapshot,
          _imageUrls: allUrls,
          _uid: supabaseUser?.id,
        })
      );

      // 4. Create Stripe Checkout session
      setUploadStatus("Initializing secure payment...");
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: calculateTotal(),
          projectTitle: watch("projectTitle"),
          email: watch("email"),
        }),
      });

      const session = await response.json();

      if (session.url) {
        // Real Stripe redirect
        setUploadStatus("Redirecting to secure payment...");
        window.location.href = session.url;
      } else {
        // Simulated path (no STRIPE_SECRET_KEY) — finish submission immediately
        await finishSubmissionAfterPayment(allUrls, formSnapshot);
      }
    } catch (err: any) {
      console.error("Pre-payment flow error:", err);
      setSubmissionError(err.message || "Failed to prepare submission. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Called after returning from Stripe (or in simulated mode) — uses pre-uploaded image URLs
  const finishSubmissionAfterPayment = async (imageUrls: string[], data: any, savedUid?: string) => {
    console.log("[SUBMIT] finishSubmissionAfterPayment starting", { imageUrls, data, savedUid });
    setIsSubmitting(true);
    setSubmissionError(null);
    setUploadStatus("Finalizing submission...");
    setUploadProgress(90);

    try {
      const coverUrl = imageUrls[0];
      const galleryUrls = imageUrls.slice(1);
      if (!coverUrl) throw new Error("Missing cover image URL.");

      const uidToUse = savedUid || supabaseUser?.id;
      if (!uidToUse) throw new Error("No user ID available. Please log in again and contact support.");

      console.log("[SUBMIT] Calling createSubmission with uid:", uidToUse);
      const createPromise = submissionService.createSubmission({
        project_title: data.projectTitle,
        category: data.categories,
        short_description: data.shortDescription,
        full_description: data.aiApproach,
        author_name: data.authorName,
        email: data.email,
        country: data.country,
        other_credits: data.otherCredits,
        image_urls: [coverUrl, ...galleryUrls],
        video_url: data.videoUrl,
      }, uidToUse);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("createSubmission timed out after 20s — likely an auth/RLS issue. Check console.")), 20000)
      );
      await Promise.race([createPromise, timeoutPromise]);
      console.log("[SUBMIT] createSubmission completed");

      setUploadProgress(100);
      setUploadStatus("Success!");

      // Send confirmation email (non-blocking)
      const categoriesText = (data.categories || [])
        .map((c: string) => CATEGORIES.find(cat => cat.id === c)?.title || c)
        .join(", ");
      // Calculate from data.categories directly — form state may not be ready after Stripe redirect
      const totalFee = calculateTotalForCategories(data.categories || []);
      const entryType = getEntryType();

      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.email,
          subject: `Submission Receipt: ${data.projectTitle} - AI Architecture Awards 2026`,
          text:
            `Thank you for your submission to the AI Architecture Awards 2026!\n\n` +
            `We have received your project "${data.projectTitle}" for the following categories: ${categoriesText}.\n\n` +
            `Submission Details:\n` +
            `- Project Title: ${data.projectTitle}\n` +
            `- Categories: ${categoriesText}\n` +
            `- Entry Type: ${entryType}\n` +
            `- Total Fee Paid: $${totalFee}\n\n` +
            `Our jury will review your work shortly.\n\nBest regards,\nThe AI Architecture Awards Team`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #000;">
              <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: inline-block; width: 60px; height: 60px; border: 2px solid #000; line-height: 60px; font-size: 24px; font-weight: bold; text-transform: uppercase;">AI</div>
              </div>
              <h1 style="text-transform: uppercase; letter-spacing: 4px; border-bottom: 4px solid #000; padding-bottom: 20px; font-size: 24px; text-align: center;">Submission Confirmed</h1>
              <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">Thank you for your submission to the <strong>AI Architecture Awards 2026</strong>!</p>
              <p style="font-size: 16px; line-height: 1.6;">We have successfully received your project "<strong>${data.projectTitle}</strong>". Your visionary work is now part of our global archive.</p>
              <div style="background: #f0f0f0; padding: 30px; margin: 30px 0; border-left: 10px solid #000;">
                <h3 style="margin-top: 0; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Project Metadata</h3>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                  <tr><td style="padding: 8px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Project Title:</td><td style="padding: 8px 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">${data.projectTitle}</td></tr>
                  <tr><td style="padding: 8px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Categories:</td><td style="padding: 8px 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">${categoriesText}</td></tr>
                  <tr><td style="padding: 8px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Entry Type:</td><td style="padding: 8px 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">${entryType}</td></tr>
                  <tr><td style="padding: 8px 0; font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Fee Paid:</td><td style="padding: 8px 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">$${totalFee}</td></tr>
                </table>
              </div>
              <p style="font-size: 14px; line-height: 1.6; color: #666;">Our jury will review your work shortly.</p>
              <p style="margin-top: 60px; font-size: 12px; border-top: 1px solid #eee; padding-top: 30px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">
                The AI Architecture Awards Team<br/>
                <span style="font-weight: normal; color: #999;">Visionary Design in the Age of Intelligence</span>
              </p>
            </div>
          `,
        }),
      }).catch(e => console.warn("[SUBMIT] Confirmation email failed (silent):", e));

      setIsSuccess(true);
      sessionStorage.removeItem("submission_draft");
      window.scrollTo(0, 0);
    } catch (error: any) {
      console.error("Finalization error:", error);
      setSubmissionError(error.message || "Failed to finalize submission. Please contact support with your payment receipt.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Form submit is a no-op — the real flow runs through handlePayment → Stripe → finishSubmissionAfterPayment.
  const onSubmit = async (_data: SubmissionForm) => {
    return;
  };

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  if (!user && !supabaseUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <div className="mb-12 flex h-24 w-24 items-center justify-center border border-black mx-auto">
          <Award className="h-10 w-10 text-black" />
        </div>
        <h2 className="text-4xl font-bold uppercase tracking-tighter">Submission Portal</h2>
        <p className="mt-6 text-gray-500 leading-relaxed">
          To enter the AI Architecture Awards 2026, please login or register to create your visionary profile.
        </p>
        <div className="mt-12 space-y-4">
          <Link
            to="/login?redirect=/submit"
            className="flex w-full items-center justify-center space-x-4 bg-black py-6 text-xs font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800"
          >
            <LogIn className="h-4 w-4" />
            <span>Login or Register</span>
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center px-4 py-32">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full text-center"
        >
          <div className="inline-flex h-24 w-24 items-center justify-center border-2 border-black mb-12">
            <Check className="h-12 w-12 text-black" />
          </div>
          
          <span className="block text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400 mb-4">Submission Confirmed</span>
          <h1 className="text-5xl font-bold uppercase tracking-tighter sm:text-7xl mb-8">Thank You</h1>
          
          <div className="space-y-6 text-xl text-gray-500 leading-relaxed mb-16">
            <p>
              Your visionary project has been successfully submitted to the <span className="text-black font-bold">AI Architecture Awards 2026</span>.
            </p>
            <p>
              A confirmation receipt has been sent to your email address. Our international jury will now begin the curation process.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/my-submissions"
              className="flex items-center justify-center space-x-4 border border-black py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-black transition-all hover:bg-gray-50"
            >
              <span>View My Submissions</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="flex items-center justify-center space-x-4 bg-black py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800"
            >
              <span>Return Home</span>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen relative">
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="max-w-md w-full px-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-black mb-8" />
            <h2 className="text-2xl font-bold uppercase tracking-tighter mb-4">{uploadStatus}</h2>
            <div className="h-1 w-full bg-gray-100 overflow-hidden">
              <motion.div 
                className="h-full bg-black"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Please do not close this window
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-32 sm:px-6 lg:px-8">
        {submissionError && (
          <div className="mb-12 border border-red-500 bg-red-50 p-6 text-red-600">
            <div className="flex items-center space-x-3">
              <X className="h-5 w-5" />
              <h3 className="font-bold uppercase tracking-tight">Submission Error</h3>
            </div>
            <p className="mt-2 text-sm">{submissionError}</p>
            <button 
              onClick={() => setSubmissionError(null)}
              className="mt-4 text-xs font-bold uppercase tracking-widest underline"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Header */}
        <div className="mb-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-400">Submission Portal</span>
          <h1 className="mt-4 text-5xl font-bold uppercase tracking-tighter sm:text-7xl">Entry Process</h1>
          
          {/* Progress Indicator */}
          <div className="mt-12 flex items-center justify-between border-b border-black pb-8">
            <div className="flex space-x-4">
              <div className={cn("h-2 w-24 transition-all duration-500", currentStep >= 1 ? "bg-black" : "bg-gray-100")} />
              <div className={cn("h-2 w-24 transition-all duration-500", currentStep >= 2 ? "bg-black" : "bg-gray-100")} />
            </div>
            <div className="flex space-x-8 text-[10px] font-bold uppercase tracking-widest">
              <span className={cn(currentStep === 1 ? "text-black" : "text-gray-300")}>01. Details</span>
              <span className={cn(currentStep === 2 ? "text-black" : "text-gray-300")}>02. Review & Payment</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-24"
              >
                {/* Step 1: Basic Info */}
                <section className="space-y-12">
                  <div className="border-l-4 border-black pl-6">
                    <h2 className="text-3xl font-bold uppercase tracking-tight">Step 1: Basic Info</h2>
                    <p className="mt-2 text-gray-500">Essential project identification and classification.</p>
                  </div>
                  
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Project Title *</label>
                      <input
                        {...register("projectTitle")}
                        className="w-full border-b border-black py-4 text-4xl font-bold uppercase tracking-tighter outline-none placeholder:text-gray-100 focus:border-gray-300 transition-colors"
                        placeholder="THE NEURAL PAVILION"
                      />
                      {errors.projectTitle && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.projectTitle.message}</p>}
                    </div>

                    <div className="space-y-6">
                      <div className="flex flex-col space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Category (Multi-select) *</label>
                        <div className="flex items-center space-x-2 bg-black/5 px-4 py-2 rounded-sm">
                          <Info className="h-3.5 w-3.5 text-black" />
                          <p className="text-[10px] font-medium text-black uppercase tracking-wider">
                            Tip: Selecting more categories increases your winning potential and offers better value per entry.
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black border border-black">
                        {CATEGORIES.map((category) => {
                          const isAnimation = category.id === 'animation';
                          const entryType = getEntryType();
                          const price = isAnimation ? 35 : (entryType === "Early Entry" ? 20 : entryType === "Standard Entry" ? 30 : 40);
                          
                          return (
                            <label
                              key={category.id}
                              className={cn(
                                "group relative flex cursor-pointer items-center justify-between bg-white p-6 transition-all hover:bg-gray-50",
                                selectedCategories.includes(category.id) && "bg-black text-white hover:bg-black"
                              )}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                value={category.id}
                                checked={selectedCategories.includes(category.id)}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const current = selectedCategories;
                                  if (e.target.checked) {
                                    setValue("categories", [...current, val]);
                                  } else {
                                    setValue("categories", current.filter((c) => c !== val));
                                  }
                                }}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold uppercase tracking-tight">{category.title}</span>
                                <span className={cn(
                                  "text-[9px] font-medium uppercase tracking-widest mt-1",
                                  selectedCategories.includes(category.id) ? "text-gray-400" : "text-gray-500"
                                )}>
                                  {isAnimation ? "$35 Fixed" : `$${price} ${entryType}`}
                                  {selectedCategories.length > 0 && !selectedCategories.includes(category.id) && " (+$10 Add-on)"}
                                </span>
                              </div>
                              <div className={cn(
                                "h-5 w-5 border border-black flex items-center justify-center transition-all",
                                selectedCategories.includes(category.id) ? "bg-white text-black" : "bg-transparent"
                              )}>
                                {selectedCategories.includes(category.id) && <Check className="h-3 w-3" />}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                      {errors.categories && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.categories.message}</p>}
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Short Description (Max 150 words) *</label>
                      <textarea
                        {...register("shortDescription")}
                        rows={4}
                        className="w-full border border-black p-6 text-lg leading-relaxed outline-none focus:bg-gray-50 transition-colors"
                        placeholder="A concise summary of the project's core concept..."
                      />
                      {errors.shortDescription && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.shortDescription.message}</p>}
                    </div>
                  </div>
                </section>

                {/* Step 2: Upload */}
                <section className="space-y-12">
                  <div className="border-l-4 border-black pl-6">
                    <h2 className="text-3xl font-bold uppercase tracking-tight">Step 2: Upload</h2>
                    <p className="mt-2 text-gray-500">Visual documentation and cinematic assets.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Cover Image */}
                    <div className="space-y-6">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Cover Image (Required) *</label>
                      <div
                        {...getCoverRootProps()}
                        className={cn(
                          "relative flex aspect-video cursor-pointer flex-col items-center justify-center border border-black border-dashed transition-all overflow-hidden",
                          isCoverDragActive ? "bg-gray-50" : "hover:bg-gray-50"
                        )}
                      >
                        <input {...getCoverInputProps()} />
                        {coverPreview ? (
                          <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                        ) : (
                          <>
                            <Upload className="mb-4 h-8 w-8 text-gray-300" />
                            <p className="text-[10px] font-bold uppercase tracking-widest">Main Visual</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Gallery Images */}
                    <div className="space-y-6">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Gallery Images (Max 5)</label>
                      <div
                        {...getGalleryRootProps()}
                        className={cn(
                          "flex h-full min-h-[150px] cursor-pointer flex-col items-center justify-center border border-black border-dashed transition-all",
                          isGalleryDragActive ? "bg-gray-50" : "hover:bg-gray-50"
                        )}
                      >
                        <input {...getGalleryInputProps()} />
                        <Upload className="mb-2 h-6 w-6 text-gray-300" />
                        <p className="text-[10px] font-bold uppercase tracking-widest">Additional Views</p>
                      </div>
                    </div>
                  </div>

                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {galleryPreviews.map((preview, idx) => (
                        <div key={idx} className="group relative aspect-square border border-gray-100 overflow-hidden">
                          <img src={preview} alt="Gallery" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(idx)}
                            className="absolute right-0 top-0 bg-black p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="flex items-center space-x-3 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
                      <Video className="h-4 w-4" />
                      <span>Video URL (Optional)</span>
                    </label>
                    <input
                      {...register("videoUrl")}
                      className="w-full border-b border-black py-4 text-lg outline-none placeholder:text-gray-100 focus:border-gray-300 transition-colors"
                      placeholder="Vimeo or YouTube URL"
                    />
                    {errors.videoUrl && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.videoUrl.message}</p>}
                  </div>
                </section>

                {/* Step 3: AI Approach */}
                <section className="space-y-12">
                  <div className="border-l-4 border-black pl-6">
                    <h2 className="text-3xl font-bold uppercase tracking-tight">Step 3: AI Approach</h2>
                    <p className="mt-2 text-gray-500">Technical methodology and workflow integration.</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Process Manifesto (Max 200 words) *</label>
                    <textarea
                      {...register("aiApproach")}
                      rows={8}
                      className="w-full border border-black p-8 text-lg leading-relaxed outline-none focus:bg-gray-50 transition-colors"
                      placeholder="Detail the AI tools used, the specific workflow, and the role of machine intelligence in your design process..."
                    />
                    {errors.aiApproach && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.aiApproach.message}</p>}
                  </div>
                </section>

                {/* Step 4: Credits */}
                <section className="space-y-12">
                  <div className="border-l-4 border-black pl-6">
                    <h2 className="text-3xl font-bold uppercase tracking-tight">Step 4: Credits</h2>
                    <p className="mt-2 text-gray-500">Author identity and contact information.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Full Name / Studio *</label>
                      <input
                        {...register("authorName")}
                        className="w-full border-b border-black py-4 text-xl font-bold uppercase tracking-tight outline-none focus:border-gray-300 transition-colors"
                        placeholder="ZAHA HADID ARCHITECTS"
                      />
                      {errors.authorName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.authorName.message}</p>}
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Email Address *</label>
                      <input
                        {...register("email")}
                        className="w-full border-b border-black py-4 text-xl font-bold uppercase tracking-tight outline-none focus:border-gray-300 transition-colors"
                        placeholder="contact@studio.com"
                      />
                      {errors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Country *</label>
                      <select
                        {...register("country")}
                        className="w-full border-b border-black py-4 text-xl font-bold uppercase tracking-tight outline-none focus:border-gray-300 transition-colors bg-white appearance-none"
                      >
                        <option value="">Select Country</option>
                        {COUNTRIES.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      {errors.country && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.country.message}</p>}
                    </div>
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Other Credits (Collaborators, Team, etc.)</label>
                      <textarea
                        {...register("otherCredits")}
                        rows={3}
                        className="w-full border border-black p-6 text-lg leading-relaxed outline-none focus:bg-gray-50 transition-colors"
                        placeholder="List team members, consultants, or other contributors..."
                      />
                      {errors.otherCredits && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{errors.otherCredits.message}</p>}
                    </div>
                  </div>
                </section>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center space-x-6 bg-black px-16 py-8 text-xs font-bold uppercase tracking-[0.5em] text-white transition-all hover:bg-gray-800"
                  >
                    <span>Continue to Review</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-24"
              >
                {/* Step 5: Review */}
                <section className="space-y-16">
                  <div className="border-l-4 border-black pl-6">
                    <h2 className="text-3xl font-bold uppercase tracking-tight">Step 5: Review & Payment</h2>
                    <p className="mt-2 text-gray-500">Verify your entry and complete the submission.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 space-y-12">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Project Title</span>
                        <h3 className="mt-4 text-6xl font-bold uppercase tracking-tighter leading-none">{watch("projectTitle")}</h3>
                        <div className="mt-6 flex flex-wrap gap-3">
                          {selectedCategories.map(cat => (
                            <span key={cat} className="bg-black px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                              {CATEGORIES.find(c => c.id === cat)?.title}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Concept Summary</span>
                        <p className="text-xl text-gray-600 leading-relaxed italic border-l-2 border-black pl-8">
                          {watch("shortDescription")}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Methodology</span>
                        <p className="text-lg text-gray-500 leading-relaxed whitespace-pre-wrap">
                          {watch("aiApproach")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-12">
                      <div className="border border-black p-8">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Author Credits</span>
                        <p className="mt-6 text-xl font-bold uppercase tracking-tight">{watch("authorName")}</p>
                        <p className="mt-2 text-sm text-gray-500">{watch("email")}</p>
                        <p className="text-sm text-gray-500">{watch("country")}</p>
                        {watch("otherCredits") && (
                          <div className="mt-6 pt-6 border-t border-black/10">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Other Credits</span>
                            <p className="mt-2 text-sm text-gray-500 whitespace-pre-wrap">{watch("otherCredits")}</p>
                          </div>
                        )}
                      </div>

                      <div className="border border-black p-8 bg-gray-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Entry Fee Breakdown</span>
                        <div className="mt-6 space-y-4">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">First Category</span>
                            <span className="text-xl font-bold">${selectedCategories.length > 0 ? Math.max(...selectedCategories.map(catId => catId === 'animation' ? 35 : (getEntryType() === "Early Entry" ? 20 : getEntryType() === "Standard Entry" ? 30 : 40))) : 0}</span>
                          </div>
                          {selectedCategories.length > 1 && (
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Additional ({selectedCategories.length - 1})</span>
                              <span className="text-xl font-bold">${(selectedCategories.length - 1) * 10}</span>
                            </div>
                          )}
                          <div className="pt-4 border-t border-black/10 flex justify-between items-end">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-black">Total Amount</span>
                            <span className="text-4xl font-bold tracking-tighter">${calculateTotal()}</span>
                          </div>
                        </div>
                        <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                          Secure payment processing via encrypted gateway. All entries are final.
                        </p>
                        
                        {!isPaid ? (
                          <button
                            type="button"
                            onClick={handlePayment}
                            disabled={isSubmitting}
                            className="mt-8 flex w-full items-center justify-center space-x-4 bg-black py-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white transition-all hover:bg-gray-800 disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Pay & Finalize</span>}
                          </button>
                        ) : (
                          <div className="mt-8 flex items-center justify-center space-x-3 text-green-600">
                            <Check className="h-5 w-5" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Payment Verified</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Visual Documentation</span>
                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-6 gap-4">
                      {coverPreview && (
                        <div className="aspect-[3/4] border border-black overflow-hidden relative">
                          <img src={coverPreview} alt="Cover" className="h-full w-full object-cover" />
                          <div className="absolute top-0 left-0 bg-black text-white px-2 py-1 text-[8px] font-bold uppercase tracking-widest">Cover</div>
                        </div>
                      )}
                      {galleryPreviews.map((preview, idx) => (
                        <div key={idx} className="aspect-[3/4] border border-gray-100 overflow-hidden">
                          <img src={preview} alt="Gallery" className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-between border-t border-black pt-12">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center space-x-4 text-[10px] font-bold uppercase tracking-[0.3em] text-black transition-all hover:translate-x-[-4px]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back to Details</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!isPaid || isSubmitting}
                    className="flex items-center space-x-6 bg-black px-20 py-8 text-xs font-bold uppercase tracking-[0.5em] text-white transition-all hover:bg-gray-800 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span>Submit Official Entry</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
