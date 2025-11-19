'use client'

import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function GlobeMesh() {
    const points = useRef<THREE.Points>(null!)

    useFrame((state, delta) => {
        if (points.current) {
            points.current.rotation.y += delta * 0.05
            points.current.rotation.x += delta * 0.01
        }
    })

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(3000 * 3)
        const radius = 2

        for (let i = 0; i < 3000; i++) {
            const theta = THREE.MathUtils.randFloatSpread(360)
            const phi = THREE.MathUtils.randFloatSpread(360)

            const x = radius * Math.sin(theta) * Math.cos(phi)
            const y = radius * Math.sin(theta) * Math.sin(phi)
            const z = radius * Math.cos(theta)

            positions.set([x, y, z], i * 3)
        }

        return positions
    }, [])

    return (
        <Points ref={points} positions={particlesPosition} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color="#ffffff"
                size={0.03}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                opacity={0.8}
            />
        </Points>
    )
}

export function Globe() {
    return (
        <div className="absolute inset-0 -z-10">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
                <ambientLight intensity={0.5} />
                <GlobeMesh />
            </Canvas>
        </div>
    )
}
