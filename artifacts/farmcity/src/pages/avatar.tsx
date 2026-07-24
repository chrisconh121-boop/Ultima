import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import {
  useGetAvatarOptions,
  useSaveAvatar,
  useGetAvatar,
  getGetAvatarQueryKey,
} from '@workspace/api-client-react';
import { SpriteAvatarPreview } from '@/components/sprite-avatar-preview';

export default function AvatarCreator() {
  const { token, player, setPlayer } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: options } = useGetAvatarOptions();
  const { data: existingAvatar } = useGetAvatar({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const [skinColor, setSkinColor] = useState('#FDDBB4');
  const [hairColor, setHairColor] = useState('#2C1503');
  const [hairStyle, setHairStyle] = useState('short');
  const [shirtColor, setShirtColor] = useState('#3498DB');
  const [pantsColor, setPantsColor] = useState('#2C3E50');
  const [hatStyle, setHatStyle] = useState('none');
  const [accessory, setAccessory] = useState('none');

  // Pre-fill from existing avatar
  useEffect(() => {
    if (existingAvatar) {
      setSkinColor(existingAvatar.skinColor);
      setHairColor(existingAvatar.hairColor);
      setHairStyle(existingAvatar.hairStyle);
      setShirtColor(existingAvatar.shirtColor);
      setPantsColor(existingAvatar.pantsColor);
      setHatStyle(existingAvatar.hatStyle ?? 'none');
      setAccessory(existingAvatar.accessory ?? 'none');
    }
  }, [existingAvatar]);

  const saveMutation = useSaveAvatar({
    mutation: {
      onSuccess: (saved) => {
        queryClient.invalidateQueries({ queryKey: getGetAvatarQueryKey() });
        if (player) {
          setPlayer({ ...player, avatar: saved as typeof player.avatar });
        }
        setLocation('/plaza');
      },
    },
  });

  if (!token) {
    setLocation('/');
    return null;
  }

  const handleSave = () => {
    saveMutation.mutate({
      data: {
        skinColor,
        hairColor,
        hairStyle,
        shirtColor,
        pantsColor,
        hatStyle: hatStyle === 'none' ? null : hatStyle,
        accessory: accessory === 'none' ? null : accessory,
      },
    });
  };

  const ColorSwatches = ({
    label,
    colors,
    selected,
    onSelect,
  }: {
    label: string;
    colors: string[];
    selected: string;
    onSelect: (c: string) => void;
  }) => (
    <div className="mb-4">
      <span className="font-['VT323'] text-sm text-[#7A4F1E] uppercase tracking-wider block mb-1.5">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onSelect(c)}
            title={c}
            className="w-8 h-8 transition-transform hover:scale-110 active:scale-95"
            style={{
              background: c,
              border: selected === c ? '3px solid #3D2010' : '2px solid #D4A96A',
              outline: selected === c ? '2px solid #FFD54F' : 'none',
              outlineOffset: '1px',
            }}
          />
        ))}
      </div>
    </div>
  );

  const StyleButtons = ({
    label,
    options: opts,
    selected,
    onSelect,
    labels,
  }: {
    label: string;
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
    labels?: Record<string, string>;
  }) => (
    <div className="mb-4">
      <span className="font-['VT323'] text-sm text-[#7A4F1E] uppercase tracking-wider block mb-1.5">
        {label}
      </span>
      <div className="flex flex-wrap gap-2">
        {opts.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className="px-3 py-1 font-['VT323'] text-sm capitalize transition-all"
            style={{
              background: selected === opt ? '#7A4F1E' : '#FFF8E7',
              color: selected === opt ? '#FFF8E7' : '#7A4F1E',
              border: '2px solid #3D2010',
            }}
          >
            {labels?.[opt] ?? (opt === 'none' ? 'Ninguno' : opt)}
          </button>
        ))}
      </div>
    </div>
  );

  const HAIR_LABELS: Record<string, string> = {
    short: 'Corto',
    spiky: 'Peinado',
    long: 'Largo',
  };

  const HAT_LABELS: Record<string, string> = {
    none: 'Sin sombrero',
    cap: 'Gorra',
    sombrero: 'Sombrero',
    straw: 'Paja',
    cowboy: 'Vaquero',
    beanie: 'Gorro',
  };

  const ACC_LABELS: Record<string, string> = {
    none: 'Sin accesorio',
    glasses: 'Lentes',
    sunglasses: 'Gafas sol',
    scarf: 'Bufanda',
    necklace: 'Collar',
    earrings: 'Aretes',
  };

  const defaultSkins = ['#FDDBB4', '#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#4A2912'];
  const defaultHairs = ['#090806', '#2C1503', '#71491E', '#B5651D', '#D4A853', '#F7DC6F', '#E8E8E8', '#FF6B6B'];
  const defaultShirts = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#ECF0F1'];
  const defaultPants = ['#2C3E50', '#6E2C00', '#1A5276', '#145A32', '#512E5F', '#17202A', '#7B7D7D'];

  return (
    <div className="fixed inset-0 overflow-y-auto" style={{ background: '#3A6E2F' }}>
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(255,255,255,0.5) 31px,rgba(255,255,255,0.5) 32px),' +
            'repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(255,255,255,0.5) 31px,rgba(255,255,255,0.5) 32px)',
        }}
      />

      <div className="relative z-10 min-h-full flex items-start justify-center p-4 py-8">
        <div className="w-full max-w-2xl">
          <h1
            className="font-['VT323'] text-5xl text-yellow-300 text-center mb-6 tracking-widest"
            style={{ textShadow: '3px 3px 0 #1A3A12' }}
          >
            🎨 Crea tu Avatar
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preview panel */}
            <div style={{ background: '#FFF8E7', border: '4px solid #3D2010' }}>
              <div
                className="px-3 py-2"
                style={{ background: '#7A4F1E', borderBottom: '3px solid #3D2010' }}
              >
                <span className="font-['VT323'] text-white text-lg tracking-widest uppercase">
                  Vista previa
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-8 gap-4">
                <div
                  style={{
                    background: '#C8E6B0',
                    border: '4px solid #3D2010',
                    padding: '8px',
                  }}
                >
                  <SpriteAvatarPreview
                    skinColor={skinColor}
                    hairColor={hairColor}
                    hairStyle={hairStyle}
                    shirtColor={shirtColor}
                    pantsColor={pantsColor}
                    size={180}
                  />
                </div>
                <div className="text-center">
                  <span className="font-['VT323'] text-[#7A4F1E] text-2xl block">
                    {player?.username ?? '...'}
                  </span>
                  <span className="font-['VT323'] text-[#A0856A] text-sm">
                    Tu personaje en FarmCity
                  </span>
                </div>
              </div>
            </div>

            {/* Options panel */}
            <div style={{ background: '#FFF8E7', border: '4px solid #3D2010' }}>
              <div
                className="px-3 py-2"
                style={{ background: '#7A4F1E', borderBottom: '3px solid #3D2010' }}
              >
                <span className="font-['VT323'] text-white text-lg tracking-widest uppercase">
                  Personalizar
                </span>
              </div>
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 420 }}>
                <ColorSwatches
                  label="Color de piel"
                  colors={options?.skinColors ?? defaultSkins}
                  selected={skinColor}
                  onSelect={setSkinColor}
                />
                <ColorSwatches
                  label="Color de cabello"
                  colors={options?.hairColors ?? defaultHairs}
                  selected={hairColor}
                  onSelect={setHairColor}
                />
                {/* Hair style — visual card selector using actual sprite images */}
                <div className="mb-4">
                  <span className="font-['VT323'] text-sm text-[#7A4F1E] uppercase tracking-wider block mb-1.5">
                    Estilo de cabello
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {(options?.hairStyles ?? ['short', 'spiky', 'long']).map((style: string) => (
                      <button
                        key={style}
                        onClick={() => setHairStyle(style)}
                        title={HAIR_LABELS[style] ?? style}
                        className="flex flex-col items-center gap-1 p-1 transition-all active:scale-95"
                        style={{
                          border: hairStyle === style ? '3px solid #3D2010' : '2px solid #D4A96A',
                          outline: hairStyle === style ? '2px solid #FFD54F' : 'none',
                          outlineOffset: '1px',
                          background: hairStyle === style ? '#FFF3C0' : '#FFF8E7',
                          minWidth: 72,
                        }}
                      >
                        <img
                          src={`${import.meta.env.BASE_URL}hair/${style}_r0.png`}
                          alt={HAIR_LABELS[style] ?? style}
                          style={{
                            width: 64,
                            height: 64,
                            imageRendering: 'pixelated',
                            objectFit: 'contain',
                          }}
                        />
                        <span
                          className="font-['VT323'] text-xs capitalize"
                          style={{ color: hairStyle === style ? '#3D2010' : '#7A4F1E' }}
                        >
                          {HAIR_LABELS[style] ?? style}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <ColorSwatches
                  label="Color de camiseta"
                  colors={options?.shirtColors ?? defaultShirts}
                  selected={shirtColor}
                  onSelect={setShirtColor}
                />
                <ColorSwatches
                  label="Color de pantalón"
                  colors={options?.pantColors ?? defaultPants}
                  selected={pantsColor}
                  onSelect={setPantsColor}
                />
                <StyleButtons
                  label="Sombrero"
                  options={options?.hatStyles ?? ['none', 'cap', 'cowboy', 'beanie']}
                  selected={hatStyle}
                  onSelect={setHatStyle}
                  labels={HAT_LABELS}
                />
                <StyleButtons
                  label="Accesorio"
                  options={options?.accessories ?? ['none', 'glasses', 'scarf']}
                  selected={accessory}
                  onSelect={setAccessory}
                  labels={ACC_LABELS}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full mt-4 py-4 font-['VT323'] text-2xl tracking-widest transition-all active:translate-y-px"
            style={{
              background: saveMutation.isPending ? '#A0856A' : '#7A4F1E',
              color: '#FFF8E7',
              border: '4px solid #3D2010',
              cursor: saveMutation.isPending ? 'wait' : 'pointer',
            }}
          >
            {saveMutation.isPending ? '⏳ Guardando...' : '🌾 ¡Entrar a la Plaza Central!'}
          </button>
        </div>
      </div>
    </div>
  );
}
