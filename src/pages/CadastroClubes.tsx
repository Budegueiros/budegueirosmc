import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Award, MapPin, Phone, Shield, User, Users } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../lib/supabase';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const confirmacaoSchema = z.object({
  nomeClube: z.string().min(3, 'Informe o nome do Moto Clube ou grupo'),
  representante: z.string().min(3, 'Informe o nome do representante presente'),
  cidade: z.string().min(2, 'Informe a cidade'),
  estado: z.string().length(2, 'Selecione o estado'),
  whatsapp: z.string().min(10, 'Informe um telefone ou WhatsApp válido'),
  estimativa: z
    .number()
    .int('Use apenas números inteiros')
    .min(1, 'A quantidade precisa ser maior que zero')
    .max(500, 'Use uma quantidade de até 500 integrantes'),
});

type FormData = {
  nomeClube: string;
  representante: string;
  cidade: string;
  estado: string;
  whatsapp: string;
  estimativa: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

type ClubePresenteExistente = {
  id: string;
  nome_clube: string;
  representante_presente: string;
  whatsapp: string;
};

const initialForm: FormData = {
  nomeClube: '',
  representante: '',
  cidade: '',
  estado: '',
  whatsapp: '',
  estimativa: '',
};

function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');

  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
  }

  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return telefone;
}

function montarMensagemDuplicidade(registro: ClubePresenteExistente): string {
  return `Este Moto Clube/Grupo ja foi cadastrado neste evento e o trofeu ja foi entregue para ${registro.representante_presente} ${formatarTelefone(registro.whatsapp)}.`;
}

async function buscarDuplicidadeNoEvento(
  eventoId: string,
  nomeClube: string,
  whatsapp: string
): Promise<{ registro: ClubePresenteExistente | null; erro: string | null }> {
  const { data, error } = await supabase.rpc('verificar_duplicidade_clube_evento', {
    p_evento_id: eventoId,
    p_nome_clube: nomeClube,
    p_whatsapp: whatsapp.replace(/\D/g, ''),
  });

  if (error) {
    return { registro: null, erro: 'Erro ao validar se o Moto Clube ja foi cadastrado neste evento.' };
  }

  const registro = (Array.isArray(data) ? data[0] : data) as ClubePresenteExistente | null;

  return { registro: registro || null, erro: null };
}

export default function CadastroClubes() {
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [eventoId, setEventoId] = useState<string | null>(null);
  const [loadingEvento, setLoadingEvento] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const inputClass = useMemo(
    () =>
      'w-full rounded-xl border border-gray-800 bg-black px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-red transition',
    []
  );

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    if (formError) {
      setFormError(null);
    }
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  useEffect(() => {
    let mounted = true;

    const carregarEvento = async () => {
      setLoadingEvento(true);

      const hoje = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('eventos')
        .select('id')
        .eq('status', 'Ativo')
        .gte('data_evento', hoje)
        .order('data_evento', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (error) {
        setFormError('Nao foi possivel carregar o evento ativo. Tente novamente em instantes.');
        setEventoId(null);
      } else if (!data?.id) {
        setFormError('Nenhum evento ativo foi encontrado para registrar presenca.');
        setEventoId(null);
      } else {
        setEventoId(data.id);
      }

      setLoadingEvento(false);
    };

    carregarEvento();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = confirmacaoSchema.safeParse({
      nomeClube: formData.nomeClube.trim(),
      representante: formData.representante.trim(),
      cidade: formData.cidade.trim(),
      estado: formData.estado,
      whatsapp: formData.whatsapp.replace(/\D/g, ''),
      estimativa: Number(formData.estimativa),
    });

    if (!parsed.success) {
      const fieldErrors: FormErrors = {};

      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof FormData | undefined;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }

    if (!eventoId) {
      setFormError('Nao foi possivel identificar o evento para esse registro.');
      return;
    }

    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    const nomeClubeNormalizado = parsed.data.nomeClube.trim();
    const whatsappNumeros = parsed.data.whatsapp;

    const { registro: duplicidadePrevia, erro: erroDuplicidadePrevia } = await buscarDuplicidadeNoEvento(
      eventoId,
      nomeClubeNormalizado,
      whatsappNumeros
    );

    if (erroDuplicidadePrevia) {
      setFormError(`${erroDuplicidadePrevia} Tente novamente.`);
      setIsSubmitting(false);
      return;
    }

    if (duplicidadePrevia) {
      setFormError(montarMensagemDuplicidade(duplicidadePrevia));
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from('clubes_presentes_eventos')
      .insert({
        evento_id: eventoId,
        nome_clube: nomeClubeNormalizado,
        representante_presente: parsed.data.representante,
        cidade: parsed.data.cidade,
        estado: parsed.data.estado.toUpperCase(),
        whatsapp: whatsappNumeros,
        integrantes_presentes: parsed.data.estimativa,
      });

    if (error) {
      if (error.code === '23505') {
        const { registro: registroDuplicado, erro: erroDuplicidadePosInsert } = await buscarDuplicidadeNoEvento(
          eventoId,
          nomeClubeNormalizado,
          whatsappNumeros
        );

        if (!erroDuplicidadePosInsert && registroDuplicado) {
          setFormError(montarMensagemDuplicidade(registroDuplicado));
        } else {
          setFormError('Esse Moto Clube/Grupo ja foi registrado neste evento e o trofeu ja foi entregue.');
        }
      } else {
        setFormError('Erro ao registrar presenca. Verifique sua conexao e tente novamente.');
      }
      setIsSubmitting(false);
      return;
    }

    setSubmitted(true);
    setIsSubmitting(false);
    setFormData(initialForm);
  };

  return (
    <section className="min-h-screen bg-[#050505] pt-28 pb-16">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="mb-10 text-center">
          <div className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
            <Award className="h-10 w-10 text-amber-400" />
          </div>
          <h1 className="font-oswald text-4xl font-bold uppercase tracking-wide text-white md:text-6xl">
            Confirmação de Presença
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-400">
            Registro de presença para Moto Clubes e Moto Grupos que já estão no 2º
            Aniversário do Budegueiros MC.
          </p>
        </div>

        <div className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-gradient-to-b from-[#141414] to-[#101010] p-6 shadow-[0_0_50px_rgba(120,0,0,0.18)] md:p-10">
            {submitted ? (
              <div className="flex min-h-[480px] flex-col items-center justify-center text-center">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10">
                  <Award className="h-10 w-10 text-green-400" />
                </div>
                <h2 className="font-oswald text-3xl font-bold uppercase text-white md:text-4xl">
                  Presença registrada
                </h2>
                <p className="mt-4 max-w-xl text-gray-400">
                  O Moto Clube foi marcado como presente no evento. Esse formulário está
                  preparado para check-in no local, não para reserva antecipada.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-8 rounded-xl border border-brand-red/40 px-6 py-3 font-oswald text-sm font-bold uppercase tracking-wide text-white transition hover:border-brand-red hover:bg-brand-red"
                >
                  Registrar outro clube
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8 border-b border-white/10 pb-6">
                  <h2 className="font-oswald text-3xl font-bold uppercase text-white">
                    Clube Presente no Evento
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-400">
                    Preencha os dados do Moto Clube ou Moto Grupo que acabou de chegar.
                    Esse registro confirma a presença da comitiva no evento e apoia a
                    organização da recepção e da entrega de troféu.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {formError ? (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {formError}
                    </div>
                  ) : null}

                  <div className="grid gap-6 md:grid-cols-2">
                    <Field
                      icon={<Shield className="h-5 w-5 text-brand-red" />}
                      label="Nome do Moto Clube / Grupo"
                      error={errors.nomeClube}
                    >
                      <input
                        value={formData.nomeClube}
                        onChange={(event) => handleChange('nomeClube', event.target.value)}
                        placeholder="Ex: Budegueiros MC"
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      icon={<User className="h-5 w-5 text-brand-red" />}
                      label="Representante Presente"
                      error={errors.representante}
                    >
                      <input
                        value={formData.representante}
                        onChange={(event) => handleChange('representante', event.target.value)}
                        placeholder="Nome de quem está no evento"
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      icon={<MapPin className="h-5 w-5 text-brand-red" />}
                      label="Cidade"
                      error={errors.cidade}
                    >
                      <input
                        value={formData.cidade}
                        onChange={(event) => handleChange('cidade', event.target.value)}
                        placeholder="Ex: Belo Horizonte"
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      icon={<MapPin className="h-5 w-5 text-brand-red" />}
                      label="Estado (UF)"
                      error={errors.estado}
                    >
                      <select
                        value={formData.estado}
                        onChange={(event) => handleChange('estado', event.target.value)}
                        className={inputClass}
                      >
                        <option value="">Selecione...</option>
                        {estados.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field
                      icon={<Phone className="h-5 w-5 text-brand-red" />}
                      label="WhatsApp / Telefone"
                      error={errors.whatsapp}
                    >
                      <input
                        value={formData.whatsapp}
                        onChange={(event) => handleChange('whatsapp', event.target.value)}
                        placeholder="Contato do representante"
                        className={inputClass}
                      />
                    </Field>

                    <Field
                      icon={<Users className="h-5 w-5 text-brand-red" />}
                      label="Integrantes Presentes"
                      error={errors.estimativa}
                    >
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={formData.estimativa}
                        onChange={(event) => handleChange('estimativa', event.target.value)}
                        placeholder="Quantos chegaram com o clube?"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || loadingEvento || !eventoId}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#d50000] px-6 py-5 font-oswald text-xl font-bold uppercase tracking-wide text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Award className="h-6 w-6" />
                    {isSubmitting
                      ? 'Registrando Presenca...'
                      : loadingEvento
                        ? 'Carregando Evento...'
                        : 'Confirmar Clube Presente'}
                  </button>
                </form>
              </>
            )}
        </div>
      </div>
    </section>
  );
}

function Field({
  icon,
  label,
  error,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 flex items-center gap-3 text-lg font-semibold text-gray-200">
        {icon}
        {label}
      </span>
      {children}
      {error ? <span className="mt-2 block text-sm text-red-400">{error}</span> : null}
    </label>
  );
}
