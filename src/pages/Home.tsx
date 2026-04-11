import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Home() {
    const navigate = useNavigate();

    useEffect(() => {
        // Detectar se é um link de convite e redirecionar para /accept-invite
        // Ou se é um link de recovery e redirecionar para /reset-password
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');

        if (type === 'invite' && accessToken) {
            // Manter o hash e redirecionar
            navigate(`/accept-invite${hash}`);
        } else if (type === 'recovery' && accessToken) {
            // Redirecionar para reset-password mantendo o hash
            navigate(`/reset-password${hash}`);
        }
    }, [navigate]);

    return (
        <section
            id="home"
            className="relative h-screen w-full overflow-hidden bg-brand-dark"
        >
            <video
                className="absolute inset-x-0 bottom-0 top-20 h-[calc(100%-5rem)] w-full object-contain bg-black md:object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
            >
                <source src="/Motorcycles_and_active_202604111001.mp4" type="video/mp4" />
            </video>

            <div className="absolute inset-x-0 bottom-0 top-20 bg-black/20" />
        </section>
    )
}
