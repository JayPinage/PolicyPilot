import React, { useState } from 'react';
import { UserPlus, CheckCircle2, Shield, Info, Copy, Check } from 'lucide-react';
import { createEmployeeApi } from '../../api/auth';
import { User } from '../../types/auth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardContent } from '../../components/common/Card';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../api/axios';

export const EmployeesPage: React.FC = () => {
  const { success, error } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});

  const [createdEmployee, setCreatedEmployee] = useState<{
    user: User;
    initialPassword: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const validate = (): boolean => {
    const errors: { fullName?: string; email?: string; password?: string } = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 5) {
      errors.password = 'Password must contain at least 5 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const newUser = await createEmployeeApi({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });

      success(`Account for "${newUser.full_name}" created successfully.`, 'Employee Created');
      setCreatedEmployee({
        user: newUser,
        initialPassword: password,
      });

      // Clear form
      setFullName('');
      setEmail('');
      setPassword('');
      setFormErrors({});
    } catch (err) {
      const msg = getErrorMessage(err);
      error(msg, 'Creation Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdEmployee) return;
    const text = `PolicyPilot Login Credentials:\nEmail: ${createdEmployee.user.email}\nPassword: ${createdEmployee.initialPassword}\nPortal: ${window.location.origin}/login`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Employee Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Create employee accounts with access to the PolicyPilot AI assistant.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Creation Form */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader
              title="Create Employee Account"
              description="Enter the employee details to provision their account"
            />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Sarah Connor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={formErrors.fullName}
                  disabled={isSubmitting}
                />

                <Input
                  label="Work Email"
                  type="email"
                  placeholder="e.g. s.connor@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={formErrors.email}
                  disabled={isSubmitting}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimum 5 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={formErrors.password}
                  helperText="Backend requires at least 5 characters"
                  disabled={isSubmitting}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={isSubmitting}
                    icon={<UserPlus className="w-4 h-4" />}
                  >
                    Provision Account
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informational & Success Cards */}
        <div className="md:col-span-2 space-y-4">
          {createdEmployee && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <h4 className="text-xs font-semibold">Account Provisioned</h4>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-200/80 text-xs space-y-1.5 font-mono">
                  <div>
                    <span className="text-slate-400">Name: </span>
                    <span className="text-slate-900 font-semibold">{createdEmployee.user.full_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Email: </span>
                    <span className="text-slate-900">{createdEmployee.user.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Password: </span>
                    <span className="text-slate-900 font-bold">{createdEmployee.initialPassword}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Role: </span>
                    <span className="text-emerald-700 font-semibold">{createdEmployee.user.role}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCredentials}
                  className="w-full text-xs"
                  icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copied ? 'Credentials Copied!' : 'Copy Credentials'}
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h4 className="font-semibold text-slate-900">Single-Company Access</h4>
                <p className="text-slate-500 leading-relaxed">
                  Created employees can immediately log in at the PolicyPilot portal to query policies.
                  They only have access to the chat assistant and their own private conversation history.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-slate-50/60">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-slate-500 leading-relaxed">
                <p>
                  As per company security policy, public self-registration is disabled. All employees are provisioned through this portal.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
