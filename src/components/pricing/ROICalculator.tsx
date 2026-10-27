import { useState } from 'react';
import { ArrowRight, TrendingUp, Target, Calculator, Rocket } from 'lucide-react';
import { QuoteGenerator } from './QuoteGenerator';
import { cn } from '../../lib/utils';

interface ROICalculatorProps {
  className?: string;
}

export function ROICalculator({ className }: ROICalculatorProps) {
  const [monthlyRevenue, setMonthlyRevenue] = useState(300000);
  const [conversionRate, setConversionRate] = useState(2);
  const [avgOrderValue, setAvgOrderValue] = useState(15000);
  const [improvement, setImprovement] = useState(35);
  const [showQuote, setShowQuote] = useState(false);

  const currentLeads = Math.round((monthlyRevenue / avgOrderValue) * 100);
  const currentCustomers = Math.round((currentLeads * conversionRate) / 100);
  const improvedConversion = conversionRate * (1 + improvement / 100);
  const newCustomers = Math.round((currentLeads * improvedConversion) / 100);
  const additionalRevenue = (newCustomers - currentCustomers) * avgOrderValue;

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <section
      className={cn(
        'relative overflow-hidden py-16 sm:py-24 border-t border-slate-200/70',
        className,
      )}
    >
      {/* Decorative elements */}
      <div
        className="pointer-events-none absolute -top-1/2 -right-1/4 h-[600px] w-[600px] rounded-full bg-brand-50/40 blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-brand-200/30 blur-[120px]"
        aria-hidden="true"
      />

      <div className="container-site relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white mb-4">
              <Rocket className="h-4 w-4" aria-hidden="true" />
              Growth estimator
            </div>
            <h2 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              See your potential growth
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Adjust the sliders to estimate how a professional website, app, or
              marketing setup can impact your monthly revenue.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Sliders */}
            <SliderCard
              label="Monthly revenue (₹)"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
              min={50000}
              max={2000000}
              step={50000}
              unit=""
            />
            <SliderCard
              label="Conversion rate (%)"
              value={conversionRate}
              onChange={(e) => setConversionRate(Number(e.target.value))}
              min={1}
              max={10}
              step={0.5}
              unit="%"
            />
            <SliderCard
              label="Avg. order value (₹)"
              value={avgOrderValue}
              onChange={(e) => setAvgOrderValue(Number(e.target.value))}
              min={5000}
              max={100000}
              step={5000}
              unit=""
            />
            <SliderCard
              label="Expected uplift (%)"
              value={improvement}
              onChange={(e) => setImprovement(Number(e.target.value))}
              min={10}
              max={100}
              step={5}
              unit="%"
            />
          </div>

          {/* Results */}
          <div className="mt-12 rounded-3xl border border-slate-200/70 bg-white shadow-card p-8 sm:p-12">
            <div className="grid gap-6 sm:grid-cols-3">
              <ResultCard
                icon={<Target className="h-6 w-6 text-slate-500" />}
                label="Current customers / month"
                value={currentCustomers.toLocaleString('en-IN')}
                sub="based on your inputs"
              />
              <ResultCard
                icon={<TrendingUp className="h-6 w-6 text-brand-600" />}
                label="Projected customers / month"
                value={newCustomers.toLocaleString('en-IN')}
                sub="+{(newCustomers - currentCustomers).toLocaleString('en-IN')}"
              />
              <ResultCard
                icon={<Calculator className="h-6 w-6 text-slate-500" />}
                label="Added monthly revenue"
                value={formatINR(additionalRevenue)}
                sub="estimated uplift"
              />
            </div>

            <div className="mt-10 flex items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-6">
              <div>
                <p className="text-sm font-medium text-brand-800">
                  That's up to {formatINR(additionalRevenue * 12)} per year
                </p>
                <p className="text-xs text-brand-700/70">
                  from a {improvement}% conversion uplift
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuote(true)}
                className="inline-flex items-center gap-2 btn btn-primary btn-sm"
              >
                <span className="btn-content flex items-center gap-2">
                  Get a custom proposal
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Estimates are illustrative, not a guarantee of results. Actual
            performance depends on market conditions, offer, and execution.
          </p>
        </div>
      </div>

      <QuoteGenerator
        open={showQuote}
        onClose={() => setShowQuote(false)}
      />
    </section>
  );
}

interface SliderCardProps {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}

function SliderCard({ label, value, onChange, min, max, step, unit }: SliderCardProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);

  const display = unit === '' ? formatINR(value) : `${value}${unit}`;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-xs font-heading font-bold text-ink">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
      />
      <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium tracking-tighter uppercase">
        <span>{formatINR(min)}</span>
        <span>{formatINR(max)}</span>
      </div>
    </div>
  );
}

interface ResultCardProps {
  icon: React.ReactElement;
  label: string;
  value: string;
  sub: string;
}

function ResultCard({ icon, label, value, sub }: ResultCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
        {icon}
      </div>
      <h3 className="mt-4 font-heading text-lg font-bold text-ink">{value}</h3>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-[10px] text-brand-600 font-medium">{sub}</p>
    </div>
  );
}
