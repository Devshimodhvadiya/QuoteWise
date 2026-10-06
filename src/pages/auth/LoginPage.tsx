import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { loginUser } from '../../firebase/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await loginUser(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        toast.error('Invalid email or password');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error('Login failed. Please check your credentials or create an account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-800 p-12 text-white shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-inner">
            <Zap size={22} className="text-white" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight block">QuoteWise</span>
            <span className="text-xs text-indigo-200 uppercase tracking-widest font-medium">Smart Quotation Comparator</span>
          </div>
        </div>

        <div className="my-auto py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-indigo-100 text-xs font-semibold mb-6 border border-white/20">
            <ShieldCheck size={14} className="text-emerald-300" />
            <span>Secure Multi-Tenant Procurement Platform</span>
          </div>
          <blockquote className="text-3xl font-light leading-relaxed text-white">
            "Eliminate guesswork in procurement with automated weighted vendor scoring, hard constraints, and live radar analytics."
          </blockquote>
          
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Evaluation Metrics', value: '4 Factors', desc: 'Price, Delivery, Warranty, Rating' },
              { label: 'Tenant Security', value: 'Isolated', desc: 'Strict company data isolation' },
              { label: 'Decision Logic', value: 'Auditable', desc: 'Transparent score breakdown' },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs font-semibold text-indigo-200 mt-1">{s.label}</p>
                <p className="text-[11px] text-white/60 mt-0.5 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-indigo-200 border-t border-white/10 pt-6">
          <p>© {new Date().getFullYear()} QuoteWise Procurement Intelligence.</p>
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-medium border border-emerald-400/30">
            <CheckCircle2 size={13} className="text-emerald-300" />
            Enterprise Cloud
          </span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
              <Zap size={20} />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-xl tracking-tight block">QuoteWise</span>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Quotation Comparator</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Sign in to QuoteWise</h2>
            <p className="mt-1 text-sm text-slate-500">
              Access your organization's procurement workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
              leftIcon={<Mail size={16} />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  leftIcon={<Lock size={16} />}
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in with Email
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              Need to set up a new company workspace?{' '}
              <Link to="/register" className="text-indigo-600 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
