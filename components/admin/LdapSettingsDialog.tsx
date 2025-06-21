"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Default LDAP parameters – can be edited by admin and saved
const DEFAULT_LDAP_CONFIG: LdapConfig = {
  url: 'ldap://dc02.tallman.com', // DC02 server
  bindDN: 'CN=LDAP,DC=tallman,DC=com',
  bindCredentials: 'ebGGAm77kk',
  searchBase: '',
  searchFilter: '',
};

type LdapConfig = {
  url?: string;
  bindDN?: string;
  bindCredentials?: string;
  searchBase?: string;
  searchFilter?: string;
};

export default function LdapSettingsDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [config, setConfig] = useState<LdapConfig>(DEFAULT_LDAP_CONFIG);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch("/api/admin/ldap-config");
        const data = await res.json();
        if (data.config && Object.keys(data.config).length) {
          setConfig({ ...DEFAULT_LDAP_CONFIG, ...data.config });
        }
      } catch (e) {
        toast({ title: "Error", description: "Failed to load LDAP config", variant: "destructive" });
      }
    })();
  }, [open, toast]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/ldap-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ title: "Saved", description: "LDAP configuration updated" });
      onOpenChange(false);
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const bind = (key: keyof LdapConfig) => ({
    value: config[key] ?? "",
    onChange: (e: any) => setConfig({ ...config, [key]: e.target.value }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>LDAP Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="url">LDAP URL</Label>
            <Input id="url" placeholder="ldap://example.com" {...bind("url")} />
          </div>
          <div>
            <Label htmlFor="bindDN">Bind DN</Label>
            <Input id="bindDN" {...bind("bindDN")} />
          </div>
          <div>
            <Label htmlFor="bindCredentials">Bind Password</Label>
            <Input id="bindCredentials" type="password" {...bind("bindCredentials")} />
          </div>
          <div>
            <Label htmlFor="searchBase">Search Base</Label>
            <Input id="searchBase" {...bind("searchBase")} />
          </div>
          <div>
            <Label htmlFor="searchFilter">Search Filter</Label>
            <Input id="searchFilter" {...bind("searchFilter")} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
