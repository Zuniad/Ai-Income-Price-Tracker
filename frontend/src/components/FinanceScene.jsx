import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function Coin({ position, speed = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.y += 0.02 * speed;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
  });
  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={ref} position={position}>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
        <meshStandardMaterial color="#00ff88" metalness={0.8} roughness={0.2} emissive="#00ff88" emissiveIntensity={0.3} />
      </mesh>
    </Float>
  );
}

function FloatingParticles() {
  const count = 50;
  const ref = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#00aaff" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function CurrencySymbol({ position, color }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.2;
  });
  return (
    <Float speed={2} rotationIntensity={0.5}>
      <mesh ref={ref} position={position}>
        <boxGeometry args={[0.6, 0.6, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.3} emissive={color} emissiveIntensity={0.2} />
      </mesh>
    </Float>
  );
}

export default function FinanceScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#00ff88" />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color="#00aaff" />
        <pointLight position={[0, 5, -5]} intensity={0.3} color="#aa55ff" />

        <Coin position={[-2.5, 1.5, -1]} speed={1.2} />
        <Coin position={[2.8, -0.5, -2]} speed={0.8} />
        <Coin position={[-1, -1.5, 0]} speed={1} />
        <Coin position={[1.5, 2, -1.5]} speed={0.6} />

        <CurrencySymbol position={[3, 1, -1]} symbol="$" color="#00ff88" />
        <CurrencySymbol position={[-3, -1, -2]} symbol="€" color="#00aaff" />
        <CurrencySymbol position={[0, 2.5, -1]} symbol="₹" color="#ff8800" />

        <FloatingParticles />
        <Sparkles count={100} scale={8} size={1.5} speed={0.4} color="#00ff88" opacity={0.3} />
      </Canvas>
    </div>
  );
}
