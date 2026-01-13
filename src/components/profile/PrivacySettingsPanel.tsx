'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Users, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  showInSearch: boolean;
  showLocation: boolean;
  showSavedLocations: 'public' | 'followers' | 'private';
  allowFollowRequests: boolean;
}

export default function PrivacySettingsPanel() {
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showInSearch: true,
    showLocation: true,
    showSavedLocations: 'public',
    allowFollowRequests: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/v1/users/me');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          profileVisibility: data.user.profileVisibility || 'public',
          showInSearch: data.user.showInSearch ?? true,
          showLocation: data.user.showLocation ?? true,
          showSavedLocations: data.user.showSavedLocations || 'public',
          allowFollowRequests: data.user.allowFollowRequests ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Privacy settings updated');
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to save privacy settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <Globe className="h-4 w-4" />;
      case 'followers':
        return <Users className="h-4 w-4" />;
      case 'private':
        return <Lock className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getVisibilityDescription = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Anyone can view';
      case 'followers':
        return 'Only followers can view';
      case 'private':
        return 'Only you can view';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Who can view your profile</Label>
            <Select
              value={settings.profileVisibility}
              onValueChange={(value: 'public' | 'followers' | 'private') =>
                setSettings({ ...settings, profileVisibility: value })
              }
            >
              <SelectTrigger id="profileVisibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">Anyone can view</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Followers Only</div>
                      <div className="text-xs text-muted-foreground">Only your followers</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">Only you can view</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {getVisibilityDescription(settings.profileVisibility)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showInSearch">Show in search results</Label>
              <p className="text-sm text-muted-foreground">
                Allow others to find you when searching
              </p>
            </div>
            <Switch
              id="showInSearch"
              checked={settings.showInSearch}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showInSearch: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowFollowRequests">Allow follow requests</Label>
              <p className="text-sm text-muted-foreground">
                Let others send you follow requests
              </p>
            </div>
            <Switch
              id="allowFollowRequests"
              checked={settings.allowFollowRequests}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, allowFollowRequests: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Location Privacy
          </CardTitle>
          <CardDescription>
            Control visibility of your location information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showLocation">Show location on profile</Label>
              <p className="text-sm text-muted-foreground">
                Display city and country on your public profile
              </p>
            </div>
            <Switch
              id="showLocation"
              checked={settings.showLocation}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showLocation: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="showSavedLocations">Saved locations visibility</Label>
            <Select
              value={settings.showSavedLocations}
              onValueChange={(value: 'public' | 'followers' | 'private') =>
                setSettings({ ...settings, showSavedLocations: value })
              }
            >
              <SelectTrigger id="showSavedLocations">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Public</div>
                      <div className="text-xs text-muted-foreground">
                        Anyone can see your saved locations
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Followers Only</div>
                      <div className="text-xs text-muted-foreground">
                        Only followers can see
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Private</div>
                      <div className="text-xs text-muted-foreground">Only you can see</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Control who can view locations you&apos;ve saved on the map
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Summary */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Privacy Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile visibility:</span>
              <Badge variant="outline" className="gap-1">
                {getVisibilityIcon(settings.profileVisibility)}
                {settings.profileVisibility}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Searchable:</span>
              <Badge variant={settings.showInSearch ? 'default' : 'secondary'}>
                {settings.showInSearch ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Location visible:</span>
              <Badge variant={settings.showLocation ? 'default' : 'secondary'}>
                {settings.showLocation ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Saved locations:</span>
              <Badge variant="outline" className="gap-1">
                {getVisibilityIcon(settings.showSavedLocations)}
                {settings.showSavedLocations}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Privacy Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
