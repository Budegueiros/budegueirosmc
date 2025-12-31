import { useState, useEffect } from 'react';
import { User, Shield, Award, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { MembroComCargos } from '../types/database.types';

export default function Sobre() {
    const [membros, setMembros] = useState<MembroComCargos[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarMembros();
    }, []);

    const carregarMembros = async () => {
        try {
            // Buscar todos os membros ativos
            const { data: membrosData, error: membrosError } = await supabase
                .from('membros')
                .select('*')
                .eq('ativo', true)
                .order('created_at', { ascending: true });

            if (membrosError) throw membrosError;

            // Para cada membro, buscar seus cargos ativos
            const membrosComCargos: MembroComCargos[] = await Promise.all(
                (membrosData || []).map(async (membro) => {
                    const { data: cargosData, error: cargosError } = await supabase
                        .from('membro_cargos')
                        .select(`
                            cargos (
                                id,
                                nome,
                                nivel,
                                tipo_cargo,
                                descricao
                            )
                        `)
                        .eq('membro_id', membro.id)
                        .eq('ativo', true);

                    if (cargosError) {
                        console.error('Erro ao buscar cargos:', cargosError);
                    }

                    return {
                        ...membro,
                        cargos: cargosData?.map((mc: any) => mc.cargos).filter(Boolean) || []
                    };
                })
            );

            setMembros(membrosComCargos);
        } catch (error) {
            console.error('Erro ao carregar membros:', error);
        } finally {
            setLoading(false);
        }
    };

    // Função para determinar a ordem de prioridade dos cargos
    const getRolePriority = (cargos: any[]) => {
        if (!cargos || cargos.length === 0) return 100;
        
        // Retornar o menor nível entre os cargos (quanto menor, maior a prioridade)
        return Math.min(...cargos.map(c => c.nivel || 999));
    };

    const getMainRole = (cargos: any[]) => {
        if (!cargos || cargos.length === 0) return 'MEMBRO';
        
        const cargoNomes = cargos.map(c => c.nome);
        
        if (cargoNomes.includes('Presidente')) return 'Presidente';
        if (cargoNomes.includes('Vice-Presidente')) return 'Vice-Presidente';
        
        // Retornar o cargo com menor nível (maior prioridade)
        const cargoMaiorPrioridade = [...cargos].sort((a, b) => 
            (a.nivel || 999) - (b.nivel || 999)
        )[0];
        
        return cargoMaiorPrioridade?.nome || 'MEMBRO';
    };

    // Ordenar membros por hierarquia
    const sortedMembers = [...membros].sort((a, b) => {
        return getRolePriority(a.cargos) - getRolePriority(b.cargos);
    });

    const presidents = sortedMembers.filter(m => getRolePriority(m.cargos) === 1);
    const vps = sortedMembers.filter(m => getRolePriority(m.cargos) === 2);
    const officers = sortedMembers.filter(m => getRolePriority(m.cargos) === 3);
    const fullMembers = sortedMembers.filter(m => {
        const priority = getRolePriority(m.cargos);
        return priority > 3 && priority < 100;
    });

    const MemberCard = ({ member, size = 'normal' }: { member: MembroComCargos, size?: 'large' | 'normal' }) => (
        <div className={`bg-[#1a1d23] border border-gray-800 rounded-lg overflow-hidden flex flex-col items-center p-6 hover:border-red-900/50 transition-all group ${size === 'large' ? 'transform md:scale-105 border-red-900/30 shadow-[0_0_30px_rgba(220,38,38,0.1)]' : ''}`}>
            <div className={`rounded-full bg-gray-900 border-4 border-[#252a33] overflow-hidden mb-4 group-hover:border-red-600 transition-colors ${size === 'large' ? 'w-40 h-40' : 'w-24 h-24'}`}>
                {member.foto_url ? (
                    <img src={member.foto_url} alt={member.nome_guerra} className="w-full h-full object-cover" />
                ) : (
                    <User className="w-full h-full p-4 text-gray-600" />
                )}
            </div>
            <h3 className={`text-white font-bold uppercase ${size === 'large' ? 'text-2xl' : 'text-lg'}`}>
                {member.nome_guerra}
            </h3>
            <span className="text-red-500 font-bold text-xs bg-red-900/10 px-3 py-1 rounded-full mt-2 border border-red-900/20">
                {getMainRole(member.cargos)}
            </span>
            {member.cargos && member.cargos.length > 1 && (
                <div className="mt-4 flex gap-2 flex-wrap justify-center">
                    {member.cargos
                        .filter(c => c.nome !== getMainRole(member.cargos))
                        .map(c => (
                            <span key={c.id} className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded">
                                {c.nome}
                            </span>
                        ))
                    }
                </div>
            )}
            <p className="text-gray-600 text-xs mt-4 font-mono">
                Membro #{member.numero_carteira}
            </p>
        </div>
    );

    if (loading) {
        return (
            <section className="relative py-20 min-h-screen bg-zinc-900 pt-24 overflow-hidden">
                <div className="container mx-auto px-4 pl-16 md:pl-24">
                    <div className="text-center text-white">Carregando...</div>
                </div>
            </section>
        );
    }

    return (
        <section className="relative py-20 min-h-screen bg-zinc-900 pt-24 overflow-hidden">
            <div className="container mx-auto px-4 pl-16 md:pl-24">
                <div className="animate-fade-in max-w-7xl mx-auto space-y-16 pb-12">
                    
                    {/* Hero / History Section */}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-wide border-l-4 border-red-600 pl-4 font-oswald">
                                Sobre o Clube
                            </h2>
                            <div className="text-gray-300 space-y-4 leading-relaxed text-justify">
                                <p>
                                    Fundado em 14 de abril de 2024 por Anderson, Igor, Luiz, Marconi, Michel e Weslei, o 
                                    Budegueiros Moto Clube nasceu da união de amigos que compartilham a paixão por 
                                    motocicletas, boa companhia e o desejo de explorar as estradas. Com o lema "andar 
                                    de moto e brindar à vida", o grupo não é apenas um clube, mas uma irmandade que 
                                    celebra a amizade, o respeito e o espírito de aventura.
                                </p>
                                <p>
                                    Inspirado pelos valores de união e lealdade, o clube proporciona aos seus membros 
                                    experiências marcantes, seja em viagens, encontros ou ações sociais. A organização 
                                    do Budegueiros MC se baseia na hierarquia e na disciplina, garantindo harmonia e um 
                                    convívio saudável entre seus integrantes, que compartilham do compromisso com 
                                    segurança, camaradagem e diversão.
                                </p>
                                <p>
                                    O clube é também um espaço acolhedor, onde cada membro é tratado como parte de 
                                    uma grande família unida pelo amor às motocicletas e ao prazer da convivência. Seja 
                                    em eventos, nas estradas ou no ponto de encontro tradicional no Budega do Chopp, 
                                    o Budegueiros MC mantém viva a essência da liberdade sobre duas rodas e o prazer 
                                    de celebrar cada quilômetro percorrido.
                                </p>
                            </div>
                            <div className="bg-red-900/20 border border-red-900/30 p-4 rounded text-red-200 text-sm font-semibold text-center mt-6">
                                Se você compartilha dessas paixões, o Budegueiros MC está de portas abertas 
                                para recebê-lo nessa jornada repleta de aventuras, amizades e boas histórias.
                            </div>
                        </div>
                        <div className="flex justify-center">
                            {/* Logo / Brasão */}
                            <div className="w-full max-w-md aspect-square bg-gradient-to-b from-[#1a1d23] to-black rounded-xl border border-gray-800 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                                <img
                                    src="/brasao.jpg"
                                    alt="Brasão Budegueiros MC"
                                    className="w-full h-full object-contain p-8"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Values Cards */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#1a1d23] p-6 rounded border-t-4 border-red-600">
                            <UsersIcon className="text-red-500 mb-4" size={32} />
                            <h4 className="text-white font-bold text-lg mb-2 font-oswald">Irmandade</h4>
                            <p className="text-gray-400 text-sm">Mais que amigos, somos irmãos unidos pela estrada e pela lealdade incondicional.</p>
                        </div>
                        <div className="bg-[#1a1d23] p-6 rounded border-t-4 border-white">
                            <Award className="text-white mb-4" size={32} />
                            <h4 className="text-white font-bold text-lg mb-2 font-oswald">Respeito</h4>
                            <p className="text-gray-400 text-sm">Respeito mútuo, hierarquia e disciplina são os pilares que sustentam nossa organização.</p>
                        </div>
                        <div className="bg-[#1a1d23] p-6 rounded border-t-4 border-gray-500">
                            <Shield className="text-gray-500 mb-4" size={32} />
                            <h4 className="text-white font-bold text-lg mb-2 font-oswald">Liberdade</h4>
                            <p className="text-gray-400 text-sm">A liberdade sobre duas rodas é o que nos move e nos inspira a cada novo quilômetro.</p>
                        </div>
                    </section>

                    {/* Hierarchy Chart */}
                    <section>
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-bold text-white uppercase tracking-widest mb-2 font-oswald">Hierarquia & Membros</h2>
                            <div className="h-1 w-24 bg-red-600 mx-auto"></div>
                        </div>

                        {/* President */}
                        {presidents.length > 0 && (
                            <div className="flex justify-center mb-8">
                                {presidents.map(m => <MemberCard key={m.id} member={m} size="large" />)}
                            </div>
                        )}

                        {/* Vice President */}
                        {vps.length > 0 && (
                            <div className="flex justify-center mb-12">
                                {vps.map(m => <MemberCard key={m.id} member={m} size="normal" />)}
                            </div>
                        )}

                        {/* Officers (Diretoria) */}
                        {officers.length > 0 && (
                            <div className="mb-12">
                                <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-6 border-b border-gray-800 pb-2">Oficiais & Diretoria</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {officers.map(m => <MemberCard key={m.id} member={m} />)}
                                </div>
                            </div>
                        )}

                        {/* Members */}
                        {fullMembers.length > 0 && (
                            <div className="mb-12">
                                <h3 className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-6 border-b border-gray-800 pb-2">Membros Brasão Fechado</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {fullMembers.map(m => <MemberCard key={m.id} member={m} />)}
                                </div>
                            </div>
                        )}

                    </section>
                </div>
            </div>
        </section>
    );
}
