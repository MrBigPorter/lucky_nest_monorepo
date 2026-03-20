'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Lock,
  Mail,
  User,
  FileText,
} from 'lucide-react';
import { Button, Input } from '@/components/UIComponents';
import { applicationApi } from '@/api';

// ─── Schema (no .default(), no .transform()) ────────────────────────────────
const schema = z
  .object({
    username: z
      .string()
      .min(3, 'At least 3 characters')
      .max(50)
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers and underscores'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .max(100)
      .regex(
        /^(?=.*[A-Za-z])(?=.*\d).+$/,
        'Must contain a letter and a number',
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    realName: z.string().min(1, 'Required').max(100),
    email: z.string().email('Invalid email address').max(100),
    applyReason: z.string().max(500).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

// ─── Success screen ──────────────────────────────────────────────────────────
function SuccessScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-6"
    >
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle
            className="text-green-600 dark:text-green-400"
            size={36}
          />
        </div>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        Application Submitted!
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
        Your request is pending review by an administrator.
        <br />
        You&apos;ll receive an email once it&apos;s approved or rejected.
      </p>
      <Link href="/login">
        <Button variant="outline" size="sm">
          <ArrowLeft size={14} className="mr-1" /> Back to Sign In
        </Button>
      </Link>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function RegisterApply() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: {
      username: '',
      password: '',
      confirmPassword: '',
      realName: '',
      email: '',
      applyReason: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError('');
    setSubmitting(true);
    try {
      // Get reCAPTCHA token
      let recaptchaToken = '';
      if (executeRecaptcha) {
        recaptchaToken = await executeRecaptcha('admin_apply');
      }

      await applicationApi.submit({
        username: data.username,
        password: data.password,
        realName: data.realName,
        email: data.email,
        applyReason: data.applyReason ?? '',
        recaptchaToken,
      });

      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { message?: string | string[] } };
        message?: string;
      };
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        'Submission failed. Please try again.';
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 relative overflow-hidden py-10">
      {/* Background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"
        />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/5 p-8 md:p-10"
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30 mb-4">
              J
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Request Access
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
              Fill in the form below. A super admin will review your
              application.
            </p>
          </div>

          {submitted ? (
            <SuccessScreen />
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* Username */}
              <div className="relative group">
                <User
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  size={18}
                />
                <Input
                  className="pl-10"
                  type="text"
                  placeholder="Desired username"
                  autoComplete="username"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>

              {/* Real name */}
              <div className="relative group">
                <User
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  size={18}
                />
                <Input
                  className="pl-10"
                  type="text"
                  placeholder="Full name"
                  error={errors.realName?.message}
                  {...register('realName')}
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <Mail
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  size={18}
                />
                <Input
                  className="pl-10"
                  type="email"
                  placeholder="Email address"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  size={18}
                />
                <Input
                  className="pl-10"
                  type="password"
                  placeholder="Password (min 8 chars, letter + number)"
                  autoComplete="new-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              {/* Confirm password */}
              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  size={18}
                />
                <Input
                  className="pl-10"
                  type="password"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              {/* Apply reason */}
              <div className="relative group">
                <FileText
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  size={18}
                />
                <textarea
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-800 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none"
                  rows={3}
                  placeholder="Why do you need access? (optional)"
                  maxLength={500}
                  {...register('applyReason')}
                />
              </div>

              {/* Server error */}
              {serverError && (
                <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                  {serverError}
                </p>
              )}

              {/* reCAPTCHA notice */}
              <p className="text-xs text-gray-400 text-center">
                Protected by Google reCAPTCHA. By submitting you agree to the{' '}
                <Link
                  href="/privacy-policy"
                  className="underline hover:text-primary-500"
                >
                  Privacy Policy
                </Link>
                .
              </p>

              <Button
                type="submit"
                className="w-full py-3 text-lg shadow-xl shadow-primary-500/20"
                isLoading={submitting}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Submit Application <ArrowRight size={18} />
                </span>
              </Button>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-primary-500 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </motion.div>

        <div className="mt-6 text-center text-gray-400 text-xs">
          &copy; {new Date().getFullYear()} JoyMini Admin. All rights reserved.
        </div>
      </div>
    </div>
  );
}
