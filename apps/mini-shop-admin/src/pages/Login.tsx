import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRequest } from 'ahooks';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { Button, Input } from '../components/UIComponents';
import { ArrowRight, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { authApi } from '@/api';
import { LoginResponse } from '@/type/types.ts';

// 1. 使用 Zod 定义数据结构和校验规则
const loginSchema = z.object({
  username: z.string().min(1, { message: 'Username is required.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

// 从 schema 推断出 TypeScript 类型
type LoginFormInputs = z.infer<typeof loginSchema>;

// 2. 封装 API 请求函数
async function signIn(data: LoginFormInputs): Promise<LoginResponse> {
  return await authApi.login(data);
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  const addToast = useToastStore((state) => state.addToast);

  // 3. 使用 useForm 管理表单状态和校验
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // 4. 使用 ahooks 的 useRequest 处理 API 请求
  const { loading, runAsync } = useRequest(signIn, {
    manual: true, // 手动触发
    onSuccess: (result) => {
      if (result.tokens.accessToken) {
        loginAction(result.tokens.accessToken);
        addToast('success', 'Welcome back, Admin!');
        navigate('/');
      } else {
        addToast('error', 'Login failed: No access token received.');
      }
    },
    onError: (error) => {
      // http 客户端已经处理了 toast，这里只做日志记录
      console.error('Login request failed:', error);
    },
  });

  // 5. 表单提交时调用 runAsync
  const onSubmit = (data: LoginFormInputs) => {
    runAsync(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950 relative overflow-hidden">
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

      <div className="w-full max-w-md p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="bg-white dark:bg-dark-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-white/5 p-8 md:p-10"
        >
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30 mb-4"
            >
              L
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm text-center">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="relative group">
                <User
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  size={18}
                />
                <Input
                  className="pl-10"
                  type="text"
                  placeholder="Username"
                  autoComplete="username"
                  error={errors.username?.message}
                  {...register('username')}
                />
              </div>

              <div className="relative group">
                <Lock
                  className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary-500 transition-colors"
                  size={18}
                />
                <Input
                  className="pl-10"
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-lg shadow-xl shadow-primary-500/20"
              isLoading={loading}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Sign In <ArrowRight size={18} />
              </span>
            </Button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-gray-400 text-xs"
        >
          &copy; 2024 LuxeAdmin Pro. All rights reserved.
        </motion.div>
      </div>
    </div>
  );
};
