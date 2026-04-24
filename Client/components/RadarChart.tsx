"use client";

import * as d3 from 'd3';
import { useTheme } from '@/components/theme-provider';
import { useRef } from 'react';
import { useEffect } from 'react';

export interface Concept {
    id: string;
    name: string;
    description?: string;
}

export interface RadarChartProps {
    concepts: Concept[];
    depthScores: Record<string, number>;
    theoreticalScores?: Record<string, number>; // 0-100, takes priority for the solid overlay
    practicalScores?: Record<string, number>;   // 0-100, draws the dashed overlay
}

export default function RadarChart({ concepts, depthScores, theoreticalScores, practicalScores }: RadarChartProps) {
    const dualMode = !!(theoreticalScores && practicalScores);
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        if (!containerRef.current || !concepts || concepts.length === 0) return;

        const chartSize = 380;
        const viewPadding = 78; // Protect long labels from clipping while keeping chart larger
        const width = chartSize + (viewPadding * 2);
        const height = chartSize + (viewPadding * 2);
        const margin = 56;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = (chartSize / 2) - margin;

        // Clear any existing SVG
        d3.select(containerRef.current).selectAll("svg").remove();

        const svg = d3.select(containerRef.current)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
            
        svgRef.current = svg.node();

        // Step 8 — The Glow Filter
        const defs = svg.append("defs");
        const filter = defs.append("filter")
            .attr("id", "glow")
            .attr("x", "-50%").attr("y", "-50%")
            .attr("width", "200%").attr("height", "200%");
            
        filter.append("feGaussianBlur")
            .attr("stdDeviation", "2.5")
            .attr("result", "coloredBlur");
            
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        // Main group centered in the SVG
        const g = svg.append("g")
            .attr("transform", `translate(${centerX}, ${centerY})`);

        // Depth scale
        const depthScale = d3.scaleOrdinal<number, number>()
            .domain([0, 1, 2, 3, 4, 5])
            .range([0, 0.15, 0.35, 0.55, 0.75, 1.0]);

        // calculating axes
        const getAxes = (conceptsList: Concept[]) => {
            const total = conceptsList.length;
            return conceptsList.map((concept, i) => {
                const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
                return {
                    ...concept,
                    angle,
                    x: Math.cos(angle) * maxRadius,
                    y: Math.sin(angle) * maxRadius,
                    labelX: Math.cos(angle) * (maxRadius + 26),
                    labelY: Math.sin(angle) * (maxRadius + 26)
                };
            });
        };
        const axes = getAxes(concepts);

        // Step 3 — Draw the Background Rings (Light theme adapted)
        const rings = [0.15, 0.35, 0.55, 0.75, 1.0];
        rings.forEach((ratio, i) => {
            g.append("circle")
                .attr("r", Math.max(0, ratio * maxRadius))
                .attr("fill", "none")
                .attr("stroke", isDark ? "#FFFFFF" : "#1A1A2E")
                .attr("stroke-opacity", isDark ? 0.15 : 0.08)
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", i === 4 ? "none" : "3,3");
        });

        const getLabelAnchor = (angle: number) => {
            const deg = angle * (180 / Math.PI);
            if (deg > -135 && deg < -45) return "middle";
            if (deg > 45 && Math.floor(deg) < 135) return "middle";
            if (deg >= -45 && deg <= 45) return "start";
            return "end";
        };

        // Text wrapping function for D3
        function wrapText(text: d3.Selection<SVGTextElement, unknown, null, undefined>, width: number) {
            text.each(function() {
                const textEl = d3.select(this);
                const splitLongWord = (word: string, maxChars = 12) => {
                    if (word.length <= maxChars) return [word];
                    const chunks: string[] = [];
                    for (let i = 0; i < word.length; i += maxChars) {
                        chunks.push(word.slice(i, i + maxChars));
                    }
                    return chunks;
                };

                const rawWords = textEl.text().split(/\s+/).filter(Boolean);
                const words = rawWords.flatMap((word) => splitLongWord(word)).reverse();
                let word;
                let line: string[] = [];
                let lineNumber = 0;
                const lineHeight = 1.2; // ems
                const y = textEl.attr("y");
                const x = textEl.attr("x");
                const dy = parseFloat(textEl.attr("dy") || "0");
                let tspan = textEl.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
                
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if ((tspan.node()?.getComputedTextLength() || 0) > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = textEl.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                    }
                }
            });
        }

        // Step 4 — Draw the Axis Lines
        axes.forEach(axis => {
            g.append("line")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", axis.x).attr("y2", axis.y)
                .attr("stroke", isDark ? "#FFFFFF" : "#1A1A2E")
                .attr("stroke-opacity", isDark ? 0.35 : 0.08)
                .attr("stroke-width", isDark ? 1.5 : 1)
                .style("filter", isDark ? "url(#glow)" : "none");

            g.append("text")
                .attr("x", axis.labelX)
                .attr("y", axis.labelY)
                .attr("dy", "-0.2em")
                .attr("text-anchor", getLabelAnchor(axis.angle))
                .attr("dominant-baseline", "middle")
                .attr("fill", isDark ? "#FFFFFF" : "#1A1A2E")
                .attr("fill-opacity", isDark ? 0.7 : 0.45) // faint initially
                .attr("font-size", "14.5px")
                .attr("font-family", "var(--font-ui, sans-serif)")
                .attr("font-weight", 600)
                .attr("class", `axis-label axis-label-${axis.id}`)
                .text(axis.name)
                .call(wrapText, 128); // Wider wrap keeps larger labels readable
        });

        const getPolygonPoints = (scores: Record<string, number>, mode: 'depth' | 'percent' = 'depth') => {
            return axes.map(axis => {
                const raw = scores[axis.id] ?? 0;
                const ratio = mode === 'percent'
                    ? Math.max(0, Math.min(1, raw / 100))
                    : depthScale(raw);
                const x = Math.cos(axis.angle) * ratio * maxRadius;
                const y = Math.sin(axis.angle) * ratio * maxRadius;
                return `${x},${y}`;
            }).join(" ");
        };

        // Step 5 — Draw the Filled Polygon(s)
        if (dualMode) {
            // Theoretical overlay (solid teal)
            const theoInitial = getPolygonPoints({}, 'percent');
            const theoActual = getPolygonPoints(theoreticalScores!, 'percent');
            const theoPolygon = g.append("polygon")
                .attr("class", "filled-polygon theoretical-polygon")
                .attr("points", theoInitial)
                .attr("fill", "rgba(0, 137, 123, 0.18)")
                .attr("stroke", "rgba(0, 137, 123, 0.9)")
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .style("filter", "url(#glow)");
            theoPolygon.transition().duration(1000).ease(d3.easeCubicOut).attr("points", theoActual);

            // Practical overlay (dashed amber)
            const pracInitial = getPolygonPoints({}, 'percent');
            const pracActual = getPolygonPoints(practicalScores!, 'percent');
            const pracPolygon = g.append("polygon")
                .attr("class", "practical-polygon")
                .attr("points", pracInitial)
                .attr("fill", "rgba(245, 158, 11, 0.10)")
                .attr("stroke", "rgba(245, 158, 11, 0.95)")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "6,4")
                .attr("stroke-linejoin", "round");
            pracPolygon.transition().duration(1000).delay(200).ease(d3.easeCubicOut).attr("points", pracActual);
        } else {
            const initialPoints = getPolygonPoints({});
            const actualPoints = getPolygonPoints(depthScores);

            const filledPolygon = g.append("polygon")
                .attr("class", "filled-polygon")
                .attr("points", initialPoints)
                .attr("fill", "rgba(0, 137, 123, 0.15)")
                .attr("stroke", "rgba(0, 137, 123, 0.8)")
                .attr("stroke-width", 2)
                .attr("stroke-linejoin", "round")
                .style("filter", "url(#glow)");

            filledPolygon
                .transition()
                .duration(1000)
                .ease(d3.easeCubicOut)
                .attr("points", actualPoints);
        }

        // Highlight endpoints that start with 4+
        axes.forEach(axis => {
            const score = depthScores[axis.id] || 0;
            if (score >= 4) {
                g.append("circle")
                    .attr("class", `endpoint-dot endpoint-${axis.id}`)
                    .attr("cx", axis.x)
                    .attr("cy", axis.y)
                    .attr("r", 0)
                    .attr("fill", "rgba(0, 137, 123, 1.0)")
                    .attr("filter", "url(#glow)")
                    .transition()
                    .duration(600)
                    .delay(800)
                    .ease(d3.easeBounceOut)
                    .attr("r", 4);
            }
            if (score > 0) {
                 d3.select(`.axis-label-${axis.id}`)
                    .transition()
                    .duration(400)
                    .delay(800)
                    .attr("fill-opacity", 1.0);
            }
        });

    }, [concepts, isDark, dualMode, theoreticalScores, practicalScores]);

    // Step 6 — The Update Function With Animation
    useEffect(() => {
        if (dualMode) return; // dual-mode polygons are drawn once in the main effect
        if (!svgRef.current || !concepts || concepts.length === 0) return;
        
        const svg = d3.select(svgRef.current);
        const g = svg.select("g");
        const filledPolygon = g.select(".filled-polygon");

        const chartSize = 380;
        const margin = 56;
        const maxRadius = (chartSize / 2) - margin;

        const depthScale = d3.scaleOrdinal<number, number>()
            .domain([0, 1, 2, 3, 4, 5])
            .range([0, 0.15, 0.35, 0.55, 0.75, 1.0]);

        const getAxes = (conceptsList: Concept[]) => {
            const total = conceptsList.length;
            return conceptsList.map((concept, i) => {
                const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
                return { ...concept, angle, x: Math.cos(angle) * maxRadius, y: Math.sin(angle) * maxRadius };
            });
        };
        const axes = getAxes(concepts);

        const getPolygonPoints = (scores: Record<string, number>) => {
            return axes.map(axis => {
                const depth = scores[axis.id] ?? 0;
                const ratio = depthScale(depth);
                const x = Math.cos(axis.angle) * ratio * maxRadius;
                const y = Math.sin(axis.angle) * ratio * maxRadius;
                return `${x},${y}`;
            }).join(" ");
        };

        const newPoints = getPolygonPoints(depthScores);

        filledPolygon
            .transition()
            .duration(800)
            .ease(d3.easeCubicOut)
            .attr("points", newPoints);

        axes.forEach(axis => {
            const score = depthScores[axis.id] || 0;
            
            // Brighten label
            if (score > 0) {
                g.selectAll(`.axis-label-${axis.id}`)
                    .transition()
                    .duration(400)
                    .attr("fill-opacity", 1.0);
            } else {
                g.selectAll(`.axis-label-${axis.id}`)
                    .transition()
                    .duration(400)
                    .attr("fill-opacity", isDark ? 0.7 : 0.45);
            }

            // Endpoints
            const existingDot = g.select(`.endpoint-${axis.id}`);
            if (score >= 4) {
                if (existingDot.empty()) {
                    g.append("circle")
                        .attr("class", `endpoint-dot endpoint-${axis.id}`)
                        .attr("cx", axis.x)
                        .attr("cy", axis.y)
                        .attr("r", 0)
                        .attr("fill", "rgba(0, 137, 123, 1.0)")
                        .attr("filter", "url(#glow)")
                        .transition()
                        .duration(600)
                        .ease(d3.easeBounceOut)
                        .attr("r", 4);
                }
            } else {
                if (!existingDot.empty()) {
                    existingDot.remove();
                }
            }
        });

    }, [depthScores, concepts, isDark, dualMode]);

    return (
        <div 
            id="radar-container" 
            ref={containerRef} 
            className="w-full h-full min-h-[250px] flex items-center justify-center pointer-events-none"
        />
    );
}
