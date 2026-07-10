import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  useListDiscordGuilds, 
  useListDiscordChannels, 
  useListDiscordRoles, 
  useGetBotConfig, 
  useUpdateBotConfig,
  getGetBotConfigQueryKey,
  getListDiscordChannelsQueryKey,
  getListDiscordRolesQueryKey,
  type DiscordGuild,
  type DiscordChannel,
  type DiscordRole
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Shield, CheckCircle2, XCircle, Users, ChevronDown, Check, Server, Radio, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Home() {
  const { data: guilds = [], isLoading: isLoadingGuilds, isError: isErrorGuilds } = useListDiscordGuilds();
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);

  // Auto-select if only 1 guild
  useEffect(() => {
    if (guilds.length === 1 && !selectedGuildId) {
      setSelectedGuildId(guilds[0].id);
    }
  }, [guilds, selectedGuildId]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      <Header isConnected={!isErrorGuilds} />
      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-6xl mx-auto w-full space-y-12">
        <ServerSelector 
          guilds={guilds} 
          selectedGuildId={selectedGuildId} 
          onSelect={setSelectedGuildId} 
          isLoading={isLoadingGuilds} 
        />
        {selectedGuildId && (
          <ConfigSection guildId={selectedGuildId} />
        )}
      </main>
    </div>
  );
}

function Header({ isConnected }: { isConnected: boolean }) {
  return (
    <header className="border-b border-border/50 bg-card/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-12 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-md flex items-center justify-center shadow-[0_0_15px_rgba(204,0,0,0.3)] border border-primary-foreground/20">
            <Shield className="w-6 h-6 text-primary-foreground drop-shadow-md" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight uppercase text-foreground leading-tight drop-shadow-sm">LARPC</h1>
            <h2 className="text-xs md:text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase leading-tight mt-0.5">Los Angeles Fire Department</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-sm border text-xs font-bold uppercase tracking-widest shadow-inner", 
            isConnected 
              ? "bg-green-500/10 border-green-500/30 text-green-500" 
              : "bg-destructive/10 border-destructive/30 text-destructive"
          )}>
            {isConnected ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span className="hidden sm:inline">{isConnected ? 'System Online' : 'System Offline'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

function ServerSelector({ guilds, selectedGuildId, onSelect, isLoading }: { guilds: DiscordGuild[], selectedGuildId: string | null, onSelect: (id: string) => void, isLoading: boolean }) {
  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Server className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold tracking-[0.15em] uppercase text-foreground">Authorized Sectors</h2>
        </div>
        <p className="text-sm text-muted-foreground pl-8">Select a server to configure operational routing.</p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-[88px] bg-card/50 rounded-lg border border-border/50 animate-pulse" />)}
        </div>
      ) : guilds.length === 0 ? (
        <Card className="bg-card/20 border-dashed border-border/50">
          <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <Server className="w-10 h-10 mb-4 opacity-30" />
            <p className="text-sm tracking-wide uppercase">No authorized servers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guilds.map(guild => (
            <button
              key={guild.id}
              onClick={() => onSelect(guild.id)}
              className={cn(
                "group relative text-left flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 overflow-hidden",
                selectedGuildId === guild.id 
                  ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(204,0,0,0.15)] ring-1 ring-primary/20" 
                  : "bg-card border-border/50 hover:border-primary/50 hover:bg-card/80"
              )}
            >
              {selectedGuildId === guild.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(204,0,0,0.8)]" />
              )}
              {guild.iconUrl ? (
                <img src={guild.iconUrl} alt={guild.name} className="w-12 h-12 rounded-md bg-secondary border border-border/50 object-cover shadow-sm group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-12 h-12 rounded-md bg-secondary border border-border/50 flex items-center justify-center text-lg font-bold shadow-sm">
                  {guild.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <h3 className={cn(
                  "font-bold truncate tracking-wide text-sm", 
                  selectedGuildId === guild.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground transition-colors"
                )}>
                  {guild.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-1.5 opacity-70">
                  <Users className="w-3.5 h-3.5" />
                  {guild.memberCount.toLocaleString()}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function ConfigSection({ guildId }: { guildId: string }) {
  const queryClient = useQueryClient();
  
  const { data: config, isLoading: isLoadingConfig } = useGetBotConfig(
    { guildId },
    { query: { enabled: !!guildId, queryKey: getGetBotConfigQueryKey({ guildId }) } }
  );

  const { data: roles = [] } = useListDiscordRoles(
    { guildId },
    { query: { enabled: !!guildId, queryKey: getListDiscordRolesQueryKey({ guildId }) } }
  );

  const { data: channels = [] } = useListDiscordChannels(
    { guildId },
    { query: { enabled: !!guildId, queryKey: getListDiscordChannelsQueryKey({ guildId }) } }
  );

  const updateConfig = useUpdateBotConfig();

  const [roleId, setRoleId] = useState<string | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);

  // Sync state with server config when it loads or guild changes
  const prevGuildId = useRef(guildId);
  useEffect(() => {
    if (config && (!roleId || prevGuildId.current !== guildId)) {
      setRoleId(config.cadetRoleId || null);
      setChannelId(config.cadetChannelId || null);
      prevGuildId.current = guildId;
    }
  }, [config, guildId]);

  // Reset local state if guild changes before config loads
  useEffect(() => {
    if (prevGuildId.current !== guildId) {
      setRoleId(null);
      setChannelId(null);
      prevGuildId.current = guildId;
    }
  }, [guildId]);

  const handleSave = () => {
    updateConfig.mutate(
      { data: { guildId, cadetRoleId: roleId, cadetChannelId: channelId } },
      {
        onSuccess: (newConfig) => {
          toast.success('Configuration saved', {
            description: 'Routing updated for selected sector.'
          });
          queryClient.setQueryData(getGetBotConfigQueryKey({ guildId }), newConfig);
        },
        onError: () => {
          toast.error('Transmission Failed', {
            description: 'Could not update configuration.'
          });
        }
      }
    )
  };

  const hasChanges = roleId !== (config?.cadetRoleId || null) || channelId !== (config?.cadetChannelId || null);

  // Group channels by category
  const channelsByCategory = useMemo(() => {
    const grouped: Record<string, typeof channels> = {};
    channels.forEach(ch => {
      const cat = ch.categoryName || 'UNCATEGORIZED';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(ch);
    });
    return grouped;
  }, [channels]);

  if (isLoadingConfig && !config) {
    return (
      <section className="space-y-6 animate-pulse">
        <div className="h-64 bg-card/30 rounded-lg border border-border/50"></div>
      </section>
    );
  }

  return (
    <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
      <Card className="border-border/50 shadow-xl overflow-hidden bg-card/90 backdrop-blur-sm relative">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/50 to-transparent" />
        
        <CardHeader className="border-b border-border/30 pb-6 pt-8 bg-black/20">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-sm border border-primary/20">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl uppercase tracking-[0.1em] font-bold text-foreground drop-shadow-sm">Operational Configuration</CardTitle>
              <CardDescription className="text-sm tracking-wide mt-1.5 opacity-80">Define the automated routing for cadet applications in this sector.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary/80" /> Target Designation Role
              </label>
              <RoleCombobox roles={roles} value={roleId} onChange={setRoleId} />
              <p className="text-[11px] text-muted-foreground/70 tracking-wide leading-relaxed font-mono">
                Personnel assigned this role will receive appropriate clearances automatically.
              </p>
            </div>
            
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <Radio className="w-4 h-4 text-primary/80" /> Broadcast Frequency
              </label>
              <ChannelCombobox channelsByCategory={channelsByCategory} value={channelId} onChange={setChannelId} />
              <p className="text-[11px] text-muted-foreground/70 tracking-wide leading-relaxed font-mono">
                System notifications and applicant statuses will be broadcast to this channel.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-8 py-6 bg-black/40 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm font-mono text-muted-foreground tracking-wide flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", hasChanges ? "bg-amber-500 animate-pulse" : "bg-muted")} />
            {updateConfig.isPending ? 'TRANSMITTING DATA...' : hasChanges ? 'UNSAVED MODIFICATIONS DETECTED' : 'CONFIGURATION SYNCHRONIZED'}
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updateConfig.isPending}
            size="lg"
            className="w-full md:w-auto tracking-[0.15em] font-bold shadow-[0_0_20px_rgba(204,0,0,0.2)] hover:shadow-[0_0_25px_rgba(204,0,0,0.4)] transition-all h-12 px-8 rounded-sm"
          >
            {updateConfig.isPending ? 'SAVING...' : 'SAVE CONFIGURATION'}
          </Button>
        </CardFooter>
      </Card>

      {/* Active config summary */}
      {config && (config.cadetRoleName || config.cadetChannelName) && (
        <div className="px-1">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3 pl-1">Current Routing Status</h3>
          <Card className="bg-card/40 border-border/30 backdrop-blur-sm overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500/50" />
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4 text-sm">
              <div className="flex items-center gap-2.5 text-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                <span className="uppercase tracking-[0.15em] font-bold text-xs">Active</span>
              </div>
              
              <div className="hidden md:block h-5 w-px bg-border/50 mx-2" />
              
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-black/30 border border-border/30 px-3 py-1.5 rounded-sm">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-mono text-xs text-foreground">
                    {config.cadetRoleName ? `@${config.cadetRoleName}` : <span className="text-muted-foreground/50 italic">UNASSIGNED</span>}
                  </span>
                </div>
                
                <span className="text-muted-foreground/50">→</span>
                
                <div className="flex items-center gap-2 bg-black/30 border border-border/30 px-3 py-1.5 rounded-sm">
                  <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-mono text-xs text-foreground">
                    {config.cadetChannelName ? `#${config.cadetChannelName}` : <span className="text-muted-foreground/50 italic">UNASSIGNED</span>}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}

function RoleCombobox({ roles, value, onChange }: { roles: DiscordRole[], value: string | null, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  
  const selectedRole = roles.find(r => r.id === value);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-black/40 border-border/50 hover:bg-black/60 hover:border-primary/50 font-mono tracking-normal h-12 rounded-sm"
        >
          {selectedRole ? (
            <div className="flex items-center gap-3 truncate">
              <div 
                className="w-3.5 h-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" 
                style={{ backgroundColor: selectedRole.color ? `#${selectedRole.color.toString(16).padStart(6, '0')}` : '#7289da' }} 
              />
              <span className="truncate text-[13px]">@{selectedRole.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground/60 text-[13px] tracking-wide">Select role...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-sm border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl" align="start">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search roles..." className="font-mono text-xs h-12 border-b-border/30" />
          <CommandEmpty className="py-6 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">No matching designation.</CommandEmpty>
          <CommandList className="max-h-[250px]">
            <CommandGroup className="p-1.5">
              {roles.map((role) => (
                <CommandItem
                  key={role.id}
                  value={role.name}
                  onSelect={() => {
                    onChange(role.id);
                    setOpen(false);
                  }}
                  className="font-mono text-xs cursor-pointer py-2.5 px-3 rounded-sm aria-selected:bg-primary/20 aria-selected:text-primary-foreground"
                >
                  <Check
                    className={cn(
                      "mr-3 h-4 w-4 text-primary",
                      value === role.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div 
                    className="w-3 h-3 rounded-full mr-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]" 
                    style={{ backgroundColor: role.color ? `#${role.color.toString(16).padStart(6, '0')}` : '#7289da' }} 
                  />
                  <span className="truncate">{role.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function ChannelCombobox({ channelsByCategory, value, onChange }: { channelsByCategory: Record<string, DiscordChannel[]>, value: string | null, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  
  let selectedChannel: DiscordChannel | undefined;
  for (const cat in channelsByCategory) {
    const found = channelsByCategory[cat].find(c => c.id === value);
    if (found) {
      selectedChannel = found;
      break;
    }
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-black/40 border-border/50 hover:bg-black/60 hover:border-primary/50 font-mono tracking-normal h-12 rounded-sm"
        >
          {selectedChannel ? (
            <span className="truncate text-[13px]">#{selectedChannel.name}</span>
          ) : (
            <span className="text-muted-foreground/60 text-[13px] tracking-wide">Select channel...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-sm border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl" align="start">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search channels..." className="font-mono text-xs h-12 border-b-border/30" />
          <CommandEmpty className="py-6 text-center text-xs font-mono text-muted-foreground uppercase tracking-widest">No matching frequency.</CommandEmpty>
          <CommandList className="max-h-[250px]">
            {Object.entries(channelsByCategory).map(([category, channels]) => (
              <CommandGroup key={category} heading={category.toUpperCase()} className="p-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-[0.2em] [&_[cmdk-group-heading]]:text-muted-foreground/70 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                {channels.map((channel) => (
                  <CommandItem
                    key={channel.id}
                    value={`${category} ${channel.name}`} // Add category to searchable value
                    onSelect={() => {
                      onChange(channel.id);
                      setOpen(false);
                    }}
                    className="font-mono text-[13px] cursor-pointer py-2.5 px-3 rounded-sm aria-selected:bg-primary/20 aria-selected:text-primary-foreground relative"
                  >
                    <Check
                      className={cn(
                        "absolute left-3 h-4 w-4 text-primary",
                        value === channel.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="pl-7 truncate opacity-60 mr-1">#</span>
                    <span className="truncate">{channel.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
