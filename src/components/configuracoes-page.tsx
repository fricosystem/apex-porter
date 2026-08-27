'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/theme-provider';
import {
  Sun,
  Moon,
  Monitor,
  Clock,
  LogOut,
  Info,
  FileText,
  ShieldCheck,
  Bell,
  BellRing,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createTestPushRequest,
  disablePushNotifications,
  enablePushNotifications,
} from '@/lib/push-notifications';
import { markNotificationPreferenceAsSet, showNativeNotification } from '@/lib/notifications';

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
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [loadingTestNotification, setLoadingTestNotification] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const handleToggleNotifications = async (checked: boolean) => {
    if (!user?.id) return;
    markNotificationPreferenceAsSet();
    setLoadingNotifications(true);
    try {
      if (checked) {
        const result = await enablePushNotifications(user.id, { requestPermission: true });
        if (!result.enabled) {
          updateSettings({ notificationsEnabled: false });
          if (result.permission === 'denied') {
            toast.error('A permissão foi bloqueada no navegador. Libere as notificações nas configurações do dispositivo.');
          } else {
            toast.error('Este dispositivo não oferece suporte a notificações push do sistema.');
          }
          return;
        }
        updateSettings({ notificationsEnabled: true });
        toast.success('Notificações ativadas neste dispositivo.');
      } else {
        await disablePushNotifications(user.id);
        updateSettings({ notificationsEnabled: false });
        toast.success('Notificações desativadas neste dispositivo.');
      }
    } catch (error) {
      console.warn('[FCM] Falha ao alterar preferência:', error);
      toast.error('Não foi possível atualizar as notificações neste dispositivo.');
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleTestNotification = async () => {
    if (!user?.id) return;
    if (!settings.notificationsEnabled) {
      toast.error('Ative as notificações antes de enviar um teste.');
      return;
    }
    setLoadingTestNotification(true);
    try {
      const nativeResult = await showNativeNotification(
        'TESTE DE NOTIFICAÇÃO',
        `Olá, ${user.nome}. As notificações do dispositivo estão funcionando.`,
        '/#configuracoes',
      );

      if (!nativeResult.shown) {
        const message = nativeResult.reason === 'permission-denied'
          ? 'A permissão do navegador está bloqueada. Libere notificações para apex-porter.vercel.app e tente novamente.'
          : 'O navegador não conseguiu exibir a notificação nativa. Atualize o PWA e tente novamente.';
        toast.error(message);
        return;
      }

      // Também cria a requisição para o backend FCM quando Cloud Functions estiverem disponíveis.
      await createTestPushRequest(user.id, user.nome).catch((error) => {
        console.warn('[FCM] Teste nativo exibido, mas requisição FCM não foi gravada:', error);
      });
      toast.success('Notificação nativa exibida na barra do dispositivo.');
    } catch (error) {
      console.warn('[FCM] Falha no teste nativo:', error);
      toast.error('Não foi possível exibir a notificação nativa neste dispositivo.');
    } finally {
      setLoadingTestNotification(false);
    }
  };

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

      {/* Device Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notificações do dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4 bg-muted/20">
            <div className="space-y-1">
              <Label htmlFor="settings-notifications-enabled" className="text-sm font-semibold">
                Ativar notificações neste dispositivo
              </Label>
              <p className="text-xs text-muted-foreground">
                Receba avisos de novos registros na barra de notificações do PWA, tablet ou desktop.
              </p>
            </div>
            <Switch
              id="settings-notifications-enabled"
              checked={Boolean(settings.notificationsEnabled)}
              onCheckedChange={handleToggleNotifications}
              disabled={loadingNotifications}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleTestNotification}
            disabled={loadingTestNotification || loadingNotifications || !settings.notificationsEnabled}
            className="h-10 px-6 font-medium border-primary/40 hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs w-fit"
          >
            <BellRing className="mr-2 h-4 w-4" />
            {loadingTestNotification ? 'Enviando teste...' : 'Enviar notificação de teste'}
          </Button>
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
            <span className="font-medium">1.2.13</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Sistema</span>
            <span className="font-medium uppercase">APEX PORTARIA</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Desenvolvido por</span>
            <span className="font-medium">APEX HUB</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms of use */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Termos de Uso e Serviços
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Consulte as regras de utilização, responsabilidades e diretrizes de segurança do APEX PORTARIA.
          </p>
          <Button
            type="button"
            variant="outline"
            className="w-full h-10 border-primary/40 hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => setTermsOpen(true)}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Ler termos completos
          </Button>
        </CardContent>
      </Card>

      <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
        <DialogContent className="xl:max-w-4xl">
          <DialogHeader className="border-b border-border/60 pb-5">
            <div className="flex items-start gap-3 pr-8">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl">Termos de Uso e Serviços</DialogTitle>
                <DialogDescription className="mt-2 leading-relaxed">
                  APEX PORTARIA · Versão 1.2.13
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-7 text-sm leading-7 text-foreground/90">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-800 dark:text-amber-200">
              <p className="font-semibold">Documento operacional</p>
              <p className="mt-1">
                Este conteúdo apresenta as regras de uso do sistema para a operação interna. A administração da empresa deve revisar o texto com assessoria jurídica antes de adotá-lo como instrumento contratual definitivo.
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">1. Objeto e finalidade</h3>
              <p>
                O APEX PORTARIA é um sistema interno de controle de acesso, registro de movimentações, gestão de visitantes, veículos, correspondências, chaves, rondas, pré-autorizações, avisos e rotinas operacionais de portaria. Seu objetivo é apoiar a organização, a rastreabilidade e a segurança dos procedimentos autorizados pela empresa.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">2. Usuários e contas</h3>
              <p>
                O acesso é destinado exclusivamente a usuários cadastrados e autorizados pela administração. Cada usuário deve utilizar sua própria conta, manter suas credenciais em sigilo e comunicar imediatamente ao responsável pelo sistema qualquer suspeita de uso indevido, perda de acesso ou alteração não reconhecida.
              </p>
              <p>
                O usuário é responsável pelas operações realizadas durante sua sessão. É proibido compartilhar senha, permitir que terceiros operem uma conta autenticada ou tentar contornar os controles de permissão do sistema.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">3. Uso permitido</h3>
              <p>
                O sistema deve ser utilizado somente para atividades relacionadas à operação da portaria e às finalidades autorizadas pela empresa. Os registros devem ser preenchidos com informações verdadeiras, completas, atualizadas e compatíveis com os documentos e procedimentos aplicáveis.
              </p>
              <p>
                O usuário deve revisar os dados antes de confirmar uma entrada, saída, retirada, devolução, autorização ou ocorrência. Quando houver erro em um registro auditável, a correção deve seguir o fluxo de refação ou o procedimento administrativo definido pela empresa, sem apagar evidências.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">4. Condutas proibidas</h3>
              <p>
                Não é permitido inserir informações falsas ou discriminatórias, registrar movimentações em nome de outra pessoa, utilizar o sistema para finalidade pessoal, extrair dados sem autorização, tentar obter acesso a áreas restritas, interferir no funcionamento do serviço ou modificar, apagar ou ocultar registros fora dos fluxos disponibilizados.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">5. Registros e auditoria</h3>
              <p>
                Os registros operacionais podem conter data, horário, identificação de usuários, visitantes, colaboradores, empresas, departamentos, veículos, documentos, autorizações e informações necessárias à rastreabilidade da operação. O sistema pode manter versões anteriores, marcações de inativação e eventos de auditoria para preservar o histórico.
              </p>
              <p>
                A inativação ou correção prevista no sistema não deve ser interpretada como autorização para eliminar documentos, evidências ou informações que precisem ser mantidos por obrigação legal, política interna ou necessidade de investigação.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">6. Privacidade e proteção de dados</h3>
              <p>
                Os dados devem ser coletados e utilizados somente quando necessários às finalidades de controle de acesso, segurança, operação, atendimento de solicitações e cumprimento de obrigações aplicáveis. O tratamento deve observar as políticas internas de privacidade e a legislação de proteção de dados vigente, incluindo os princípios de finalidade, necessidade, segurança, prevenção e responsabilização.
              </p>
              <p>
                O usuário não deve copiar, fotografar, compartilhar ou transferir dados pessoais do sistema para pessoas ou serviços não autorizados. Solicitações relacionadas a acesso, correção, retenção ou eliminação de dados devem ser encaminhadas ao responsável indicado pela empresa.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">7. Segurança</h3>
              <p>
                A empresa deve adotar controles compatíveis com o risco da operação, incluindo gestão de permissões, revisão de usuários, proteção de credenciais e acompanhamento de registros. Os usuários devem utilizar dispositivos confiáveis, manter o sistema atualizado e encerrar a sessão ao deixar o posto de trabalho.
              </p>
              <p>
                Nenhum sistema conectado à internet é imune a falhas. Ao identificar comportamento suspeito, mensagem inesperada, acesso indevido ou indisponibilidade anormal, o usuário deve interromper a operação de risco e comunicar a administração.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">8. Disponibilidade e suporte</h3>
              <p>
                O APEX PORTARIA depende de infraestrutura, conectividade, serviços de autenticação e armazenamento. Podem ocorrer interrupções para manutenção, atualização, falha técnica, indisponibilidade de rede ou eventos fora do controle da empresa. Durante uma indisponibilidade, os procedimentos de contingência definidos pela administração devem ser seguidos.
              </p>
              <p>
                Solicitações de suporte devem informar o usuário, a tela, o horário aproximado, a operação realizada e a mensagem apresentada, sem enviar senhas ou dados pessoais desnecessários.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">9. Responsabilidades da administração</h3>
              <p>
                Compete à administração definir os perfis de acesso, manter os cadastros atualizados, revisar permissões, orientar os usuários, estabelecer prazos de retenção e avaliar periodicamente os registros. A empresa também deve definir quem pode aprovar autorizações, consultar dados sensíveis, realizar correções e atender solicitações de privacidade.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">10. Propriedade e uso do sistema</h3>
              <p>
                A interface, a organização funcional, os elementos visuais, os textos e os componentes do APEX PORTARIA são destinados ao uso autorizado da operação. Não é permitido copiar, modificar, redistribuir, realizar engenharia reversa ou explorar comercialmente o sistema sem autorização expressa dos responsáveis.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">11. Alterações dos termos</h3>
              <p>
                Estes termos podem ser atualizados para refletir mudanças na operação, na segurança, na legislação, nas funcionalidades ou nas políticas internas. A versão vigente será disponibilizada no próprio sistema, e alterações relevantes devem ser comunicadas aos usuários pelos canais definidos pela administração.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">12. Encerramento e medidas administrativas</h3>
              <p>
                O acesso pode ser suspenso ou encerrado quando o usuário deixar de exercer função autorizada, violar regras internas, comprometer a segurança ou utilizar o sistema de maneira incompatível com estes termos. O encerramento do acesso não elimina automaticamente registros que precisem ser mantidos para auditoria, segurança ou cumprimento de obrigação aplicável.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-semibold">13. Aceite</h3>
              <p>
                Ao utilizar o APEX PORTARIA, o usuário declara que leu estas regras, compreendeu suas responsabilidades e se compromete a utilizar o sistema de forma legítima, segura e compatível com as orientações da empresa.
              </p>
            </section>

            <div className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
              Sistema: APEX PORTARIA · Versão: 1.2.13 · Documento disponibilizado para leitura dentro do sistema.
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
