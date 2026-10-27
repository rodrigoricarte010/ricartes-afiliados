'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { saveSettingsAction, type ActionState } from '@/app/admin/actions';
import { toast } from '@/components/Toast';
import { PLATFORM_LABEL, type Settings } from '@/lib/types';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? 'Salvando…' : 'Salvar configurações'}
    </button>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action] = useActionState<ActionState, FormData>(saveSettingsAction, {});

  useEffect(() => {
    if (state.message) toast(state.message, state.ok ? 'success' : 'error');
  }, [state]);

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="display_name" className="label">
            Seu nome
          </label>
          <input id="display_name" name="display_name" defaultValue={settings.display_name} className="input" />
        </div>
        <div>
          <label htmlFor="handle" className="label">
            @ do perfil
          </label>
          <input id="handle" name="handle" defaultValue={settings.handle} className="input" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bio" className="label">
            Bio (usada na página pública)
          </label>
          <textarea id="bio" name="bio" rows={2} defaultValue={settings.bio} className="input resize-y" />
        </div>
        <div>
          <label htmlFor="support_email" className="label">
            E-mail de suporte
          </label>
          <input id="support_email" name="support_email" type="email" defaultValue={settings.support_email} className="input" />
        </div>
        <div>
          <label htmlFor="whatsapp" className="label">
            WhatsApp
          </label>
          <input id="whatsapp" name="whatsapp" defaultValue={settings.whatsapp} className="input" />
        </div>
        <div>
          <label htmlFor="pix_key" className="label">
            Chave Pix padrão
          </label>
          <input id="pix_key" name="pix_key" defaultValue={settings.pix_key} className="input" />
        </div>
        <div>
          <label htmlFor="default_commission_pct" className="label">
            Comissão média (%)
          </label>
          <input
            id="default_commission_pct"
            name="default_commission_pct"
            defaultValue={settings.default_commission_pct}
            className="input"
          />
        </div>
      </div>

      <div className="border-t border-white/[0.07] pt-5">
        <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
          Programas de afiliado
        </h3>
        <p className="mb-3 text-[11px] text-white/35">
          Marque onde você já foi aprovado. Isso ajuda a decidir em qual plataforma vale investir conteúdo.
        </p>
        <div className="space-y-2">
          {settings.affiliate_programs.map((program) => (
            <div
              key={program.platform}
              className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-white/85">{PLATFORM_LABEL[program.platform]}</p>
                {program.note && <p className="text-[11px] text-white/35">{program.note}</p>}
              </div>
              <select
                name={`program_${program.platform}`}
                defaultValue={program.status}
                className="input !w-auto min-w-[160px] !py-1.5 text-xs"
              >
                <option value="conectado" className="bg-ink-900">Conectado</option>
                <option value="pendente" className="bg-ink-900">Pendente</option>
                <option value="nao_iniciado" className="bg-ink-900">Não iniciado</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {state.message && !state.ok && (
        <p className="rounded-lg border border-brand-400/30 bg-brand-500/10 px-3 py-2 text-xs text-brand-200">
          {state.message}
        </p>
      )}

      <div className="flex justify-end border-t border-white/[0.07] pt-4">
        <Submit />
      </div>
    </form>
  );
}
