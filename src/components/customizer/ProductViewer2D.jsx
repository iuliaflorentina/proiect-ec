import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva'
import useImage from 'use-image'

const Sticker = ({ shape, isSelected, onSelect, onChange }) => {
    const [image] = useImage(shape.src, 'Anonymous')
    const shapeRef = useRef()
    const trRef = useRef()

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current])
            trRef.current.getLayer().batchDraw()
        }
    }, [isSelected])

    return (
        <>
            <KonvaImage
                image={image}
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                {...shape}
                globalCompositeOperation="multiply"
                draggable
                onDragEnd={(e) => {
                    onChange({
                        ...shape,
                        x: e.target.x(),
                        y: e.target.y(),
                    })
                }}
                onTransformEnd={(e) => {
                    const node = shapeRef.current
                    const scaleX = node.scaleX()
                    const scaleY = node.scaleY()
                    node.scaleX(1)
                    node.scaleY(1)
                    onChange({
                        ...shape,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                        rotation: node.rotation()
                    })
                }}
            />
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                            return oldBox
                        }
                        return newBox
                    }}
                />
            )}
        </>
    )
}

const ProductViewer2D = ({ product, frontOrBack, stickers, setStickers, selectedId, setSelectedId }) => {
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

    // Select image based on front or back view
    const imageUrl = product?.images[frontOrBack] || product?.image
    const [productImage] = useImage(imageUrl, 'Anonymous')

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                })
            }
        }

        // Initial dimensions
        updateDimensions()

        // Wait for rendering to complete
        setTimeout(updateDimensions, 100)

        window.addEventListener('resize', updateDimensions)
        return () => window.removeEventListener('resize', updateDimensions)
    }, [])

    const checkDeselect = (e) => {
        // Deselect when clicked on empty area or background image
        const clickedOnEmpty = e.target === e.target.getStage() || e.target.attrs.id === 'bg-image'
        if (clickedOnEmpty) {
            setSelectedId(null)
        }
    }

    // Calculate background image dimensions to fit within container
    let bgProps = { x: 0, y: 0, width: 0, height: 0 }
    if (productImage && dimensions.width && dimensions.height) {
        const imgRatio = productImage.width / productImage.height
        const containerRatio = dimensions.width / dimensions.height

        if (imgRatio > containerRatio) {
            // Image is wider
            bgProps.width = dimensions.width
            bgProps.height = dimensions.width / imgRatio
            bgProps.y = (dimensions.height - bgProps.height) / 2
        } else {
            // Image is taller
            bgProps.height = dimensions.height
            bgProps.width = dimensions.height * imgRatio
            bgProps.x = (dimensions.width - bgProps.width) / 2
        }
    }

    return (
        <div className="w-full h-full min-h-[500px] flex items-center justify-center relative bg-secondary/10" ref={containerRef}>
            {dimensions.width > 0 && dimensions.height > 0 && (
                <Stage
                    width={dimensions.width}
                    height={dimensions.height}
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                >
                    <Layer>
                        {productImage && (
                            <KonvaImage
                                id="bg-image"
                                image={productImage}
                                {...bgProps}
                            />
                        )}
                        {stickers.map((sticker, i) => (
                            <Sticker
                                key={sticker.id}
                                shape={sticker}
                                isSelected={sticker.id === selectedId}
                                onSelect={() => setSelectedId(sticker.id)}
                                onChange={(newAttrs) => {
                                    const s = stickers.slice()
                                    s[i] = newAttrs
                                    setStickers(s)
                                }}
                            />
                        ))}
                    </Layer>
                </Stage>
            )}
            <div className="absolute bottom-4 left-4 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-sm text-white">
                Drag to Move · Use Corners to Resize
            </div>

            <div className="absolute top-4 left-4">
                <div className="bg-background/80 backdrop-blur-md text-foreground px-3 py-1.5 rounded-lg border border-border shadow-sm text-sm font-medium">
                    {frontOrBack === 'front' ? 'Front View' : 'Back View'}
                </div>
            </div>
        </div>
    )
}

export default ProductViewer2D
