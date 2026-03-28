import { useRef, useState, useEffect, useMemo, Suspense, forwardRef, useImperativeHandle } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment, useGLTF, Bvh } from '@react-three/drei'
import * as THREE from 'three'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'

function Model({ product, currentColor, decals, activeSticker, selectedId, setSelectedId, onAddDecal, onUpdateDecal, onPlaceSticker, onDraggingChange, sceneRef }) {
    const defaultModel = '/models/nike_air_jordan.glb'
    let modelPath = product?.modelPath || defaultModel
    if (modelPath === '/models/oversized_tshirt.glb') {
        modelPath = '/models/oversized_tshirt_opt.glb'
    }
    const { scene } = useGLTF(modelPath)
    const { raycaster, mouse, camera } = useThree()

    const [isDragging, setIsDragging] = useState(false)
    const [dragId, setDragId] = useState(null)
    const [hoveredDecal, setHoveredDecal] = useState(null)
    const [hoveredMesh, setHoveredMesh] = useState(null)

    // We clone the scene so we can mutate materials safely
    const clonedScene = useMemo(() => {
        const cloned = scene.clone()

        // Auto scale to fit
        const box = new THREE.Box3().setFromObject(cloned)
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3.0 / maxDim
        cloned.scale.setScalar(scale)

        const centerScaled = new THREE.Box3().setFromObject(cloned).getCenter(new THREE.Vector3())
        cloned.position.sub(centerScaled)

        // Ensure every mesh has a unique material so we avoid sharing
        cloned.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true
                child.receiveShadow = true
                if (child.material) {
                    child.material = child.material.clone()
                    if (currentColor && child.name !== 'laces' && child.name !== 'sole') {
                        // Apply color. For the oversized t-shirt we just set color.
                        child.material.color.set(currentColor)
                    }
                }
            }
        })
        return cloned
    }, [scene, currentColor])

    // Apply decals dynamically
    const decalsGroupRef = useRef()
    const decalsMeshesRef = useRef({}) // to keep track of created meshes for selection

    useEffect(() => {
        if (!decalsGroupRef.current || !clonedScene) return

        // Force matrix update before DecalGeometry creates the projection!
        // This is necessary because on initial load ("Edit Design"), 
        // the WebGL renderer hasn't computed world matrices yet, making the targetMesh completely offset.
        clonedScene.updateMatrixWorld(true)

        // Clear old decals
        while (decalsGroupRef.current.children.length > 0) {
            decalsGroupRef.current.remove(decalsGroupRef.current.children[0])
        }
        decalsMeshesRef.current = {}

        const textureLoader = new THREE.TextureLoader().setCrossOrigin('anonymous')

        console.log("[ProductViewer3D] Re-applying decals, count:", decals.length)
        decals.forEach(decal => {
            // find the mesh in clonedScene
            let targetMesh = null
            clonedScene.traverse(child => {
                if (child.name === decal.meshName && child.isMesh) {
                    targetMesh = child
                }
            })
            console.log("[ProductViewer3D] Decal:", decal.id, "Target mesh:", decal.meshName, "Found:", !!targetMesh)

            if (targetMesh) {
                // decal parameters
                const pos = new THREE.Vector3().fromArray(decal.position)
                const nor = new THREE.Vector3().fromArray(decal.normal)

                // Construct orientation
                const matrix = new THREE.Matrix4()
                const n = nor.clone().normalize()
                const up = Math.abs(n.y) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
                matrix.lookAt(pos, pos.clone().add(n), up)

                // Add the user's custom Z rotation!
                const baseEuler = new THREE.Euler().setFromRotationMatrix(matrix)
                // To rotate around the normal vector, we apply an extra Z rotation
                const q1 = new THREE.Quaternion().setFromEuler(baseEuler)
                const q2 = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), decal.rotation)
                q1.multiply(q2)
                const finalEuler = new THREE.Euler().setFromQuaternion(q1)

                const decalGeom = new DecalGeometry(targetMesh, pos, finalEuler, new THREE.Vector3(decal.scale, decal.scale, decal.scale))

                const tex = textureLoader.load(decal.imageUrl)
                tex.colorSpace = THREE.SRGBColorSpace

                const decalMat = new THREE.MeshStandardMaterial({
                    map: tex,
                    transparent: true,
                    depthTest: true,
                    depthWrite: false,
                    polygonOffset: true,
                    polygonOffsetFactor: -4,
                    polygonOffsetUnits: -4,
                })

                const dMesh = new THREE.Mesh(decalGeom, decalMat)
                dMesh.userData = { isDecal: true, decalId: decal.id }

                // The green lines (BoxHelper) was removed as requested
                
                decalsGroupRef.current.add(dMesh)
                decalsMeshesRef.current[decal.id] = dMesh
            }
        })
    }, [clonedScene, decals, selectedId])

    const handlePointerDown = (e) => {
        const mesh = e.object

        // Did they click a decal?
        if (mesh.userData && mesh.userData.isDecal) {
            e.stopPropagation()
            const decalId = mesh.userData.decalId
            setSelectedId(decalId)
            setIsDragging(true)
            setDragId(decalId)
            if (onDraggingChange) onDraggingChange(true)
            // Enable pointer capture to keep dragging even if the mouse leaves the decal bounds
            e.target.setPointerCapture(e.pointerId)
            return
        }

        // Clicked the 3D shoe itself
        if (mesh.isMesh) {
            e.stopPropagation()
            const normal = e.face.normal.clone()
            // transform normal to world space
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
            normal.applyMatrix3(normalMatrix).normalize()

            if (activeSticker) {
                // Place a new decal
                onAddDecal({
                    id: `decal-${Date.now()}`,
                    meshName: mesh.name,
                    position: e.point.toArray(),
                    normal: normal.toArray(),
                    scale: 0.8, // default scale
                    rotation: 0, // default rotation
                    imageUrl: activeSticker.src
                })
                // Clear active sticker so we can move instead of adding more
                if (onPlaceSticker) onPlaceSticker()
            } else {
              // Just selecting the model mesh if nothing is active
              setSelectedId(null)
            }
        }
    }

    const handlePointerUp = (e) => {
        if (isDragging) {
          e.target.releasePointerCapture(e.pointerId)
          setIsDragging(false)
          setDragId(null)
          if (onDraggingChange) onDraggingChange(false)
        }
    }

    const handlePointerMove = (e) => {
        if (isDragging && dragId) {
            // No stopPropagation here to let the raycaster hit the model underneath
            
            // We need to raycast against the main model to find the new surface position
            raycaster.setFromCamera(mouse, camera)
            // Intersect the whole scene to find the underlying mesh
            const intersects = raycaster.intersectObject(clonedScene, true)
            
            // Look for the first mesh intersection that is NOT a decal
            const hit = intersects.find(i => i.object.isMesh && !i.object.userData.isDecal)

            if (hit) {
                const mesh = hit.object
                const normal = hit.face.normal.clone()
                const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
                normal.applyMatrix3(normalMatrix).normalize()

                onUpdateDecal(dragId, {
                    meshName: mesh.name,
                    position: hit.point.toArray(),
                    normal: normal.toArray()
                })
            }
        }
    }

    // Cursor handling
    useEffect(() => {
        let cursor = 'auto'
        if (isDragging) {
            cursor = 'grabbing'
        } else if (hoveredDecal) {
            cursor = 'grab'
        } else if (activeSticker && hoveredMesh) {
            cursor = 'copy'
        } else if (hoveredMesh) {
            cursor = 'crosshair'
        }
        
        document.body.style.cursor = cursor
        return () => { document.body.style.cursor = 'auto' }
    }, [isDragging, hoveredDecal, hoveredMesh, activeSticker])

    return (
        <group 
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            ref={sceneRef}
        >
            <primitive
                object={clonedScene}
                onPointerDown={handlePointerDown}
                onPointerOver={(e) => { e.stopPropagation(); setHoveredMesh(e.object.name); }}
                onPointerOut={(e) => { e.stopPropagation(); setHoveredMesh(null); }}
            />
            <group
                ref={decalsGroupRef}
                onPointerDown={handlePointerDown}
                onPointerOver={(e) => { e.stopPropagation(); if(e.object.userData.isDecal) setHoveredDecal(e.object.userData.decalId); }}
                onPointerOut={(e) => { e.stopPropagation(); setHoveredDecal(null); }}
            />
        </group>
    )
}

const ProductViewer3D = forwardRef(({ product, currentColor, decals, activeSticker, selectedId, setSelectedId, onAddDecal, onUpdateDecal, onPlaceSticker }, ref) => {
    const [isDragging, setIsDragging] = useState(false)
    const sceneRef = useRef()

    useImperativeHandle(ref, () => ({
        getScene: () => sceneRef.current
    }))

    return (
        <div className="w-full h-full min-h-[500px] relative bg-[#0a0a0a]">
            <Canvas camera={{ position: [0, 1.5, 4], fov: 50 }} preserveDrawingBuffer={true}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
                <directionalLight position={[-5, 5, -5]} intensity={0.5} />

                <Suspense fallback={null}>
                    <Bvh firstHitOnly>
                        <Model
                            product={product}
                            currentColor={currentColor}
                            decals={decals}
                            activeSticker={activeSticker}
                            selectedId={selectedId}
                            setSelectedId={setSelectedId}
                            onAddDecal={onAddDecal}
                            onUpdateDecal={onUpdateDecal}
                            onPlaceSticker={onPlaceSticker}
                            onDraggingChange={setIsDragging}
                            sceneRef={sceneRef}
                        />
                    </Bvh>
                    <ContactShadows position={[0, -1.05, 0]} opacity={0.6} scale={10} blur={2} far={4} />
                    <Environment preset="city" />
                </Suspense>

                <OrbitControls makeDefault enabled={!isDragging} minDistance={2} maxDistance={10} maxPolarAngle={Math.PI / 2 + 0.1} />
            </Canvas>
            <div className="absolute bottom-4 left-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Click to Select · Drag Element to Move · Scroll to Zoom
            </div>
        </div>
    )
})

useGLTF.preload('/models/nike_air_jordan.glb')
useGLTF.preload('/models/oversized_tshirt.glb')
useGLTF.preload('/models/oversized_tshirt_opt.glb')
useGLTF.preload('/models/tshirt_new.glb')
useGLTF.preload('/models/jacket.glb')
useGLTF.preload('/models/jacket_002.glb')

export default ProductViewer3D
