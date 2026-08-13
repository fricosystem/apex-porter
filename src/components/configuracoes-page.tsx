'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Sun,
  Moon,
  Monitor,
  Clock,
  LogOut,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

export default function ConfiguracoesPage() {
  const { user, logout, settings, updateSettings } = useAppStore();
  const { resolvedTheme, setTheme } = useTheme();

  const checkTime = useCallback(() => {
    if (!settings.autoTheme || settings.fixedTheme) return;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = settings.darkModeStart.split(':').map(Number);
    const [endH, endM] = settings.darkModeEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    let isDarkTime: boolean;
    if (startMinutes > endMinutes) {
      isDarkTime = currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      isDarkTime = currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }

    const root = document.documentElement;
    root.classList.remove('dark-apex');

    if (isDarkTime) {
      const chosenDark = settings.autoDarkTheme || 'dark';
      setTheme('dark');
      if (chosenDark === 'dark-apex') {
        requestAnimationFrame(() => {
          root.classList.add('dark-apex');
        });
      }
    } else {
      setTheme('light');
    }
  }, [settings.autoTheme, settings.fixedTheme, settings.darkModeStart, settings.darkModeEnd, settings.autoDarkTheme, setTheme]);

  // Auto theme switching logic
  useEffect(() => {
    if (!settings.autoTheme || settings.fixedTheme) return;
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [settings.autoTheme, settings.fixedTheme, checkTime]);

  const theme = resolvedTheme || 'light';

  const handleThemeChange = (newTheme: string) => {
    const root = document.documentElement;
    // Always remove dark-apex class first
    root.classList.remove('dark-apex');

    if (newTheme === 'dark-apex') {
      // For dark-apex: set next-themes to 'dark' so dark: utilities work,
      // then add 'dark-apex' class to override CSS variables with our custom palette
      setTheme('dark');
      // Small delay to ensure next-themes has applied 'dark' first
      requestAnimationFrame(() => {
        root.classList.add('dark-apex');
      });
    } else {
      setTheme(newTheme);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto overflow-x-hidden scrollable-list p-4 md:p-6 pb-28 space-y-4"
    >
      <div>
        <h2 className="text-xl font-bold">Configurações</h2>
        <p className="text-sm text-muted-foreground">
          Personalize o aplicativo
        </p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            Tema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant={!settings.autoTheme && settings.themePreference === 'light' ? 'default' : 'outline'}
              className={`h-16 flex-col gap-1 ${!settings.autoTheme && settings.themePreference === 'light' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => {
                updateSettings({ autoTheme: false, themePreference: 'light' });
                handleThemeChange('light');
              }}
            >
              <Sun className="h-5 w-5" />
              <span className="text-xs">Claro</span>
            </Button>
            <Button
              variant={!settings.autoTheme && settings.themePreference === 'dark' ? 'default' : 'outline'}
              className={`h-16 flex-col gap-1 ${!settings.autoTheme && settings.themePreference === 'dark' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => {
                updateSettings({ autoTheme: false, themePreference: 'dark' });
                handleThemeChange('dark');
              }}
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs">Escuro</span>
            </Button>
            <Button
              variant={!settings.autoTheme && settings.themePreference === 'dark-apex' ? 'default' : 'outline'}
              className={`h-16 flex-col gap-1 ${!settings.autoTheme && settings.themePreference === 'dark-apex' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => {
                updateSettings({ autoTheme: false, themePreference: 'dark-apex' });
                handleThemeChange('dark-apex');
              }}
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs">Escuro APEX</span>
            </Button>
            <Button
              variant={settings.autoTheme ? 'default' : 'outline'}
              className={`h-16 flex-col gap-1 ${settings.autoTheme ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => {
                updateSettings({ autoTheme: true, themePreference: 'auto' });
                toast.success('Modo automático ativado');
              }}
            >
              <Monitor className="h-5 w-5" />
              <span className="text-xs">Auto</span>
            </Button>
          </div>

          <Separator />

          {/* Auto Theme Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Modo automático</Label>
              <Switch
                checked={settings.autoTheme}
                onCheckedChange={(checked) => {
                  updateSettings({ autoTheme: checked });
                  toast.success(checked ? 'Modo automático ativado' : 'Modo automático desativado');
                }}
              />
            </div>

            {settings.autoTheme && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pl-0"
              >
                <div className="space-y-2.5 border-b pb-3 mb-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Temas ativos no Automático</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Claro (implicitly always part of the automatic cycle) */}
                    <div className="flex items-center space-x-3 rounded-lg border p-2.5 bg-muted/30 dark:bg-muted/10 opacity-75">
                      <Checkbox checked disabled id="auto-theme-claro" />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor="auto-theme-claro"
                          className="text-xs font-medium cursor-not-allowed text-foreground"
                        >
                          Claro (Dia)
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          Tema padrão fora do horário noturno.
                        </span>
                      </div>
                    </div>

                    {/* Escuro (Night option 1) */}
                    <div 
                      className={`flex items-center space-x-3 rounded-lg border p-2.5 transition-all cursor-pointer ${
                        settings.autoDarkTheme === 'dark' 
                          ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10' 
                          : 'hover:bg-muted/30'
                      }`}
                      onClick={() => {
                        updateSettings({ autoDarkTheme: 'dark' });
                        toast.success('Tema Escuro padrão ativado para a noite');
                      }}
                    >
                      <Checkbox 
                        id="auto-theme-escuro" 
                        checked={settings.autoDarkTheme === 'dark'}
                        onCheckedChange={() => {}} // onClick on container handles this cleanly
                      />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor="auto-theme-escuro"
                          className="text-xs font-medium cursor-pointer text-foreground"
                        >
                          Escuro (Noite)
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          Tons de verde e cinza clássico escuro.
                        </span>
                      </div>
                    </div>

                    {/* Escuro APEX (Night option 2) */}
                    <div 
                      className={`flex items-center space-x-3 rounded-lg border p-2.5 transition-all cursor-pointer ${
                        settings.autoDarkTheme === 'dark-apex' 
                          ? 'border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-500/10' 
                          : 'hover:bg-muted/30'
                      }`}
                      onClick={() => {
                        updateSettings({ autoDarkTheme: 'dark-apex' });
                        toast.success('Tema Escuro APEX ativado para a noite');
                      }}
                    >
                      <Checkbox 
                        id="auto-theme-escuro-apex" 
                        checked={settings.autoDarkTheme === 'dark-apex'}
                        onCheckedChange={() => {}} // onClick on container handles this cleanly
                      />
                      <div className="grid gap-0.5 leading-none">
                        <label
                          htmlFor="auto-theme-escuro-apex"
                          className="text-xs font-medium cursor-pointer text-foreground"
                        >
                          Escuro APEX (Noite)
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          Tons azul-marinho profundos premium.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Horário início (modo escuro)
                  </Label>
                  <Input
                    type="time"
                    value={settings.darkModeStart}
                    onChange={(e) => updateSettings({ darkModeStart: e.target.value })}
                    className="w-28 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Horário fim (modo escuro)
                  </Label>
                  <Input
                    type="time"
                    value={settings.darkModeEnd}
                    onChange={(e) => updateSettings({ darkModeEnd: e.target.value })}
                    className="w-28 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Tema fixo</Label>
                  <Switch
                    checked={settings.fixedTheme}
                    onCheckedChange={(checked) => {
                      updateSettings({ fixedTheme: checked });
                      toast.success(checked ? 'Tema fixo ativado' : 'Tema fixo desativado');
                    }}
                  />
                </div>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4" />
            Sobre o App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Versão</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sistema</span>
            <span className="font-medium">APEX Portaria</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Desenvolvido por</span>
            <span className="font-medium">APEX HUB</span>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-11"
        onClick={() => {
          logout();
          toast.success('Sessão encerrada');
        }}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair da Conta
      </Button>
    </motion.div>
  );
}
