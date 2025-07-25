import React, { useState, useCallback, useEffect } from "react";
import { Header } from "./Header";
import { NetworkGraph } from "./network/NetworkGraph";
import { Node } from "../types/node";
import { mockNodes } from "../utils/mockData";
import { resetNodeCounter } from "../utils/nodeGenerator";
import axios from "axios";

export function Dashboard() {
  const [nodes, setNodes] = useState<Node[]>(mockNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [blacklistedIpsOutput, setBlacklistedIpsOutput] = useState<string>("No data");
  const [resourceUsage, setResourceUsage] = useState<string | null>(null);
  const [seenIps, setSeenIps] = useState<Record<string, Set<string>>>({});
  const [permanentlyInfected, setPermanentlyInfected] = useState<Set<string>>(new Set());
  // Malware Analyzer state
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    resetNodeCounter();
  }, []);

  const handleIconChange = (nodeId: string, newIcon: string) => {
    setNodes(nodes =>
      nodes.map(node => (node.id === nodeId ? { ...node, icon: newIcon } : node))
    );
  };

  const fetchResourceUsage = async (node: Node) => {
    try {
      const resourceResponse = await axios.get(`http://localhost:4000/run-stat${node.id}`);
      setResourceUsage(resourceResponse.data.output);
    } catch (error) {
      console.error("Error fetching resource usage:", error);
      setResourceUsage("Error fetching resource usage");
      updateNodeStatus(node.id, "healthy");
    }
  };

  const formatMemoryUsage = (memoryInBytes: number | undefined) => {
    if (typeof memoryInBytes !== 'number') return 'N/A';
    const mb = memoryInBytes / (1024 * 1024);
    return mb < 1024 ? `${mb.toFixed(1)} MB` : `${(mb / 1024).toFixed(2)} GB`;
  };

  const updateNodeStatus = (nodeId: string, status: string) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId ? { ...node, status } : node
      )
    );
  };

  const fetchMetrics = async (node: Node) => {
    try {
      const response = await axios.get(`http://localhost:4000/run-stat${node.id}`);
      setNodes((prevNodes) =>
        prevNodes.map(n =>
          n.id === node.id
            ? {
                ...n,
                metrics: {
                  ...response.data,
                  memory: formatMemoryUsage(response.data.memory)
                }
              }
            : n
        )
      );
    } catch (error) {
      console.error("Error fetching metrics:", error);
      updateNodeStatus(node.id, "healthy");
    }
  };

  const handleRename = useCallback((nodeId: string, newName: string) => {
    setNodes(nodes =>
      nodes.map(node => (node.id === nodeId ? { ...node, name: newName } : node))
    );
  }, []);

  const handleReset = useCallback(() => {
    setNodes(mockNodes);
    setSelectedNode(null);
    resetNodeCounter();
    setPermanentlyInfected(new Set());
  }, []);

  const extractIPsFromJSON = (text: string): string[] => {
    try {
      const obj = JSON.parse(text);
      return Object.keys(obj).filter(ip => obj[ip] === true);
    } catch {
      return [];
    }
  };

  const handleNodeClick = async (node: Node) => {
    setSelectedNode(node);
    fetchResourceUsage(node);
    try {
      const logResponse = await axios.get(`http://localhost:4000/run-log${node.id}`);
      const output = logResponse.data.output;
      setBlacklistedIpsOutput(output);
      const detectedIps = extractIPsFromJSON(output);
      const currentSeenIps = seenIps[node.id] || new Set<string>();
      let isInfected = detectedIps.length > 0;

      for (const ip of detectedIps) {
        if (!currentSeenIps.has(ip)) {
          currentSeenIps.add(ip);
        }
      }

      setSeenIps(prev => ({
        ...prev,
        [node.id]: currentSeenIps
      }));

      if (isInfected && !permanentlyInfected.has(node.id)) {
        const updatedInfected = new Set(permanentlyInfected);
        updatedInfected.add(node.id);
        setPermanentlyInfected(updatedInfected);
      }

      const newStatus = detectedIps.length > 0 ? "unhealthy" : "healthy";
      setNodes((prevNodes) =>
        prevNodes.map(n =>
          n.id === node.id
            ? {
                ...n,
                status: newStatus,
                metrics: {
                  ...n.metrics,
                  memory: formatMemoryUsage(n.metrics.memory)
                }
              }
            : n
        )
      );
    } catch (error) {
      console.error("Error fetching node data:", error);
      setBlacklistedIpsOutput("Error fetching blacklisted IPs");
      updateNodeStatus(node.id, "healthy");
    }
  };

  const handleNodeReset = async (node: Node) => {
    setSelectedNode(node);
    try {
      const response = await axios.get(`http://localhost:4000/run-reset${node.id}`);
      setBlacklistedIpsOutput(response.data.output);
      const newStatus = ["No output available", "Error fetching log output"].includes(
        response.data.output
      )
        ? "healthy"
        : "unhealthy";
      updateNodeStatus(node.id, newStatus);
    } catch (error) {
      console.error("Error fetching log output:", error);
      setBlacklistedIpsOutput("Error fetching log output");
      updateNodeStatus(node.id, "healthy");
    }
  };

  useEffect(() => {
    if (!selectedNode) return;
    const intervalId = setInterval(async () => {
      if (selectedNode) {
        await handleNodeClick(selectedNode);
        await fetchMetrics(selectedNode);
      }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [selectedNode]);

  useEffect(() => {
    if (selectedNode && !nodes.some(node => node.id === selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [nodes, selectedNode]);

  // Malware Analyzer handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 80));
    }, 200);

    try {
      const response = await axios.post("http://localhost:4000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setTimeout(() => setIsAnalyzing(false), 500);
      setAnalysisResult(response.data.result); // Use structured data from server.js
    } catch (error: any) {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisResult({ error: error.message || "Error during analysis" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-gray-900 dark:to-indigo-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-indigo-100 dark:border-indigo-900 shadow-sm">
        <Header />
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold mb-8 tracking-tight text-indigo-900 dark:text-indigo-200">
          Cybersecurity Dashboard
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden border border-indigo-100 dark:border-indigo-900 transition-all hover:shadow-xl duration-300">
            <div className="p-4 border-b border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-slate-800">
              <h2 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Network Visualization
              </h2>
            </div>
            <div className="h-[60vh] w-full p-4 bg-indigo-50 dark:bg-slate-900">
              <NetworkGraph
                nodes={nodes}
                onNodeClick={handleNodeClick}
                onRename={handleRename}
                onChangeIcon={handleIconChange}
                onAddNode={() => {}}
              />
            </div>
          </div>

          {/* Selected Node Details */}
          {selectedNode ? (
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-indigo-200 dark:hover:shadow-indigo-900">
              <div className="p-4 border-b border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-slate-800">
                <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-200 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Node {selectedNode.id} Details
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <span className={`inline-block w-3 h-3 rounded-full ${selectedNode.status === 'unhealthy' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                  <strong className="text-sm uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Status:</strong>
                  <span className={`font-semibold capitalize ${selectedNode.status === 'unhealthy' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {selectedNode.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-indigo-50 dark:bg-slate-700 p-4 rounded-lg transition-transform hover:scale-105 duration-200 shadow-sm hover:shadow">
                    <div className="text-xs text-indigo-600 dark:text-indigo-300 font-medium mb-1">Latency</div>
                    <div className="font-mono font-bold text-slate-800 dark:text-white">{selectedNode.metrics.latency} ms</div>
                  </div>
                  <div className="bg-indigo-50 dark:bg-slate-700 p-4 rounded-lg transition-transform hover:scale-105 duration-200 shadow-sm hover:shadow">
                    <div className="text-xs text-indigo-600 dark:text-indigo-300 font-medium mb-1">Memory</div>
                    <div className="font-mono font-bold text-slate-800 dark:text-white">{resourceUsage || "Loading..."}</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Blacklisted IPs
                  </h3>
                  <pre className="bg-slate-50 dark:bg-slate-900 text-xs p-4 rounded-md overflow-x-auto max-h-60 scrollbar-thin scrollbar-thumb-indigo-300 dark:scrollbar-thumb-indigo-700 border border-indigo-100 dark:border-indigo-900 shadow-inner font-mono whitespace-pre-wrap break-words">
                    {blacklistedIpsOutput || "No blacklisted IPs found"}
                  </pre>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => handleNodeReset(selectedNode)}
                    className="w-full px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-all flex items-center justify-center group shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-2 transform group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset Node
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900 overflow-hidden flex items-center justify-center p-8">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-indigo-300 dark:text-indigo-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 00-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 mb-1">No Node Selected</h3>
                <p className="text-indigo-500 dark:text-indigo-400">Click on a node in the network visualization to see its details.</p>
              </div>
            </div>
          )}

          {/* Malware Analyzer Section */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900 overflow-hidden transition-all duration-300">
            <div className="p-4 border-b border-indigo-100 dark:border-indigo-900 bg-indigo-50 dark:bg-slate-800">
              <h2 className="text-lg font-medium text-indigo-900 dark:text-indigo-200 flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Malware Analyzer
              </h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
                <div className="relative">
                  <input
                    type="file"
                    accept=".exe,image/*"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                      cursor-pointer"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!file || isAnalyzing}
                  className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-md
                    hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center gap-2
                    disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Analyze File
                </button>
              </form>
              {isAnalyzing && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">Analyzing...</p>
                </div>
              )}
              {analysisResult && (
                <div className="mt-6 bg-gray-50 p-6 rounded-lg animate-[fadeIn_0.5s_ease-out]">
                  {analysisResult.error ? (
                    <p className="text-red-600 font-medium">⚠️ {analysisResult.error}</p>
                  ) : (
                    <>
                      <p className="text-gray-700"><strong>Filename:</strong> {analysisResult.filename}</p>
                      <p className="text-gray-700">
                        <strong>Status:</strong>
                        <span className={`${analysisResult.is_malicious ? 'text-red-600' : 'text-green-600'} font-semibold`}>
                          {analysisResult.is_malicious ? 'Malicious' : 'Benign'}
                        </span>
                      </p>
                      <p className="text-gray-700"><strong>Binary Score:</strong> {analysisResult.binary_score}%</p>
                      {!analysisResult.is_malicious && analysisResult.confidence && (
                        <p className="text-gray-700"><strong>Confidence (Benign):</strong> {analysisResult.confidence}%</p>
                      )}
                      {analysisResult.malware_type && (
                        <>
                          <p className="text-gray-700"><strong>Type:</strong> {analysisResult.malware_type}</p>
                          <p className="text-gray-700"><strong>Category:</strong> {analysisResult.malware_category}</p>
                          <p className="text-gray-700"><strong>Confidence:</strong> {analysisResult.confidence}%</p>
                          <h3 className="text-lg font-semibold text-gray-800 mt-4">Top Predictions:</h3>
                          <ul className="list-disc pl-5 text-gray-700">
                            {analysisResult.top_predictions.map((pred: any, index: number) => (
                              <li key={index}>{pred.type} ({pred.category}) — {pred.confidence}%</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {analysisResult.image_url && (
                        <>
                          <p className="text-gray-700 mt-4"><strong>Converted Image:</strong></p>
                          <img
                            src={`${analysisResult.image_url}?t=${new Date().getTime()}`}
                            alt="Converted PE Image"
                            className="max-w-full h-auto rounded-md shadow-md mt-2"
                          />
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center mt-6">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-lg bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-medium transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
            >
              Reset Simulation
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}