import { X, Save, RotateCcw, Plus } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface AgentConfig {
  temperature: number;
  maxTokens: number;
  responseTime: number;
  escalationThreshold: number;
  capabilities: {
    refunds: boolean;
    technicalSupport: boolean;
    billing: boolean;
    generalInquiry: boolean;
  };
  customInstructions: string;
}

interface ConfigPreset {
  id: string;
  name: string;
  config: AgentConfig;
}

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AgentConfig;
  onSaveConfig: (config: AgentConfig) => void;
  presets: ConfigPreset[];
  onSavePreset: (name: string, config: AgentConfig) => void;
  onLoadPreset: (preset: ConfigPreset) => void;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig,
  presets,
  onSavePreset,
  onLoadPreset,
}) => {
  const [config, setConfig] = useState<AgentConfig>(currentConfig);
  const [presetName, setPresetName] = useState("");
  const [showPresetDialog, setShowPresetDialog] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(config);
    onClose();
  };

  const handleReset = () => {
    setConfig(currentConfig);
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName, config);
      setPresetName("");
      setShowPresetDialog(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-[700px] max-h-[80vh] bg-white rounded-3xl overflow-hidden border-0">
        <CardContent className="p-0">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-grey-200">
            <h2 className="text-2xl font-medium text-grey-1000">Agent Configuration</h2>
            <Button onClick={onClose} className="p-2 bg-grey-100 hover:bg-grey-200 rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="overflow-y-auto max-h-[60vh] p-6 space-y-6">
            {/* Presets */}
            <div>
              <h3 className="text-lg font-medium text-grey-1000 mb-3">Configuration Presets</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {presets.map((preset) => (
                  <Button
                    key={preset.id}
                    onClick={() => onLoadPreset(preset)}
                    className="bg-primary-200 text-grey-1000 px-3 py-1 rounded-full text-sm hover:bg-primary-400"
                  >
                    {preset.name}
                  </Button>
                ))}
                <Button
                  onClick={() => setShowPresetDialog(true)}
                  className="bg-grey-200 text-grey-1000 px-3 py-1 rounded-full text-sm hover:bg-grey-300"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Save Preset
                </Button>
              </div>
            </div>

            {/* AI Parameters */}
            <div>
              <h3 className="text-lg font-medium text-grey-1000 mb-4">AI Parameters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-grey-800 mb-2">
                    Temperature: {config.temperature}
                  </label>
                  <Slider
                    value={[config.temperature]}
                    onValueChange={(value) => setConfig({...config, temperature: value[0]})}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-grey-500 mt-1">
                    Controls randomness. Lower = more focused, Higher = more creative
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-800 mb-2">
                    Max Tokens: {config.maxTokens}
                  </label>
                  <Slider
                    value={[config.maxTokens]}
                    onValueChange={(value) => setConfig({...config, maxTokens: value[0]})}
                    max={4000}
                    min={100}
                    step={100}
                    className="w-full"
                  />
                  <p className="text-xs text-grey-500 mt-1">
                    Maximum response length
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-grey-800 mb-2">
                    Response Time Limit: {config.responseTime}s
                  </label>
                  <Slider
                    value={[config.responseTime]}
                    onValueChange={(value) => setConfig({...config, responseTime: value[0]})}
                    max={30}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Escalation Settings */}
            <div>
              <h3 className="text-lg font-medium text-grey-1000 mb-4">Escalation Settings</h3>
              <div>
                <label className="block text-sm font-medium text-grey-800 mb-2">
                  Escalation Threshold: {config.escalationThreshold}%
                </label>
                <Slider
                  value={[config.escalationThreshold]}
                  onValueChange={(value) => setConfig({...config, escalationThreshold: value[0]})}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-grey-500 mt-1">
                  Confidence threshold below which conversations are escalated
                </p>
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <h3 className="text-lg font-medium text-grey-1000 mb-4">Agent Capabilities</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(config.capabilities).map(([capability, enabled]) => (
                  <div key={capability} className="flex items-center justify-between p-3 bg-grey-100 rounded-lg">
                    <span className="text-sm font-medium text-grey-1000 capitalize">
                      {capability.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          capabilities: { ...config.capabilities, [capability]: checked }
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <h3 className="text-lg font-medium text-grey-1000 mb-4">Custom Instructions</h3>
              <Textarea
                value={config.customInstructions}
                onChange={(e) => setConfig({...config, customInstructions: e.target.value})}
                placeholder="Add specific instructions for the AI agent..."
                rows={4}
                className="w-full"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-grey-200">
            <Button
              onClick={handleReset}
              className="bg-grey-200 text-grey-1000 px-4 py-2 rounded-full flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary-1000 text-white px-6 py-2 rounded-full flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Configuration
            </Button>
          </div>

          {/* Save Preset Dialog */}
          {showPresetDialog && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Card className="w-80 bg-white rounded-2xl p-6">
                <h3 className="text-lg font-medium mb-4">Save Configuration Preset</h3>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name..."
                  className="mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    onClick={() => setShowPresetDialog(false)}
                    className="bg-grey-200 text-grey-1000 px-4 py-2 rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="bg-primary-1000 text-white px-4 py-2 rounded-full"
                  >
                    Save
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};