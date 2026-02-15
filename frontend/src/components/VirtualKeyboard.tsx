import { useState, useEffect, useRef } from "react";

interface VirtualKeyboardProps {
    cursor: { x: number; y: number };
    onKeyPress: (key: string) => void;
    onHoverKey: (key: string | null) => void;
    active: boolean;
}

const KEYS = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
    ["Z", "X", "C", "V", "B", "N", "M", " ", "⌫"],
];

export default function VirtualKeyboard({ cursor, onKeyPress, onHoverKey, active }: VirtualKeyboardProps) {

    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredKey, setHoveredKey] = useState<string | null>(null);

    useEffect(() => {
        if (!active || !containerRef.current) return;

        const elements = containerRef.current.querySelectorAll(".v-key");
        let found = false;

        elements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (
                cursor.x >= rect.left &&
                cursor.x <= rect.right &&
                cursor.y >= rect.top &&
                cursor.y <= rect.bottom
            ) {
                const key = el.getAttribute("data-key");
                setHoveredKey(key);
                onHoverKey(key);
                found = true;
            }
        });

        if (!found) {
            setHoveredKey(null);
            onHoverKey(null);
        }
    }, [cursor, active, onHoverKey]);


    useEffect(() => {
        // This will be triggered by the parent (Chatbot) calling onKeyPress when onBlink occurs
    }, []);

    if (!active) return null;

    return (
        <div className="virtual-keyboard" ref={containerRef}>
            {KEYS.map((row, i) => (
                <div key={i} className="v-row">
                    {row.map((key) => (
                        <div
                            key={key}
                            data-key={key}
                            className={`v-key ${hoveredKey === key ? "hovered" : ""} ${key === " " ? "space" : ""} ${key === "⌫" ? "backspace" : ""}`}
                        >
                            {key}
                        </div>

                    ))}
                </div>
            ))}
        </div>
    );
}
