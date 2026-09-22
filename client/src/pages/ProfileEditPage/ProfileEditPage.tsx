import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Camera } from 'lucide-react';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { toast } from 'sonner';
import { profileApi } from '@client/src/api';
import type { UserProfileInfo } from '@shared/api.interface';
import { Image } from '@client/src/components/ui/image';
import ImageEditor from '@client/src/components/ui/image-editor';
import PageBackground from '@client/src/components/PageBackground';
import { useImageDedup } from '@client/src/hooks/useImageDedup';

const ProfileEditPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfileInfo | null>(null);
  const [username, setUsername] = useState('');
  const [signature, setSignature] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { checkAndReuse, registerUploadedImage } = useImageDedup();

  const isDirty = profile
    ? username !== profile.username ||
      signature !== profile.signature ||
      avatarUrl !== profile.avatarUrl
    : false;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await profileApi.getProfile();
        if (!mounted) return;
        setProfile(data);
        setUsername(data.username);
        setSignature(data.signature);
        setAvatarUrl(data.avatarUrl);
      } catch (err) {
        logger.error('[profile-edit] load failed', err);
        toast.error('加载失败，请稍后重试');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile({
        username: username.trim(),
        signature,
        avatarUrl,
      });
      setProfile(updated);
      toast.success('保存成功');
      setTimeout(() => navigate('/profile'), 300);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '保存失败';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('只支持图片格式');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    setEditorFile(file);
    setEditorOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditorCancel = () => {
    setEditorOpen(false);
    setEditorFile(null);
  };

  const handleEditorConfirm = async (blob: Blob, fileName: string) => {
    setEditorOpen(false);
    setUploadingAvatar(true);
    try {
      const existingUrl = await checkAndReuse(blob);
      if (existingUrl) {
        setAvatarUrl(existingUrl);
        toast.success('头像上传成功');
        return;
      }

      const dataloom = await getDataloom();
      const uploadFile = new File([blob], fileName, { type: blob.type });
      const { data, error } = await dataloom
        .storage
        .from(getDefaultBucketId())
        .uploadFile(uploadFile);
      if (error || !data) {
        const errAny = error as any;
        throw new Error(errAny?.message || errAny?.error_msg || '上传失败');
      }
      setAvatarUrl(data.download_url);
      registerUploadedImage(blob, fileName, data.download_url);
      toast.success('头像上传成功');
    } catch (err) {
      logger.error('[profile-edit] avatar upload failed', err);
      toast.error(err instanceof Error ? err.message : '头像上传失败');
    } finally {
      setUploadingAvatar(false);
      setEditorFile(null);
    }
  };

  return (
    <div className="relative min-h-screen">
      <PageBackground />
      <div
        className="osmanthus-corner pointer-events-none"
        style={{
          position: 'absolute',
          zIndex: 0,
          top: '-45px',
          right: '-55px',
          width: '320px',
          maxWidth: '78vw',
          opacity: 0.9,
          pointerEvents: 'none',
          transformOrigin: 'top right',
          transform: 'translateX(-100%) scaleX(-1) rotate(15deg)',
        }}
        aria-hidden="true"
      >
        <Image
          src="https://aka.doubaocdn.com/s/9jIrYowigU"
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            objectFit: 'contain',
          }}
        />
      </div>
      <div className="page-content-wrap relative z-10 min-h-screen flex flex-col">
      <style>{`
        .edit-page-header {
          width: 100%;
          max-width: 520px;
          margin: 0 auto;
        }
        .edit-title {
          text-align: center;
          font-size: 18px;
        }
        .edit-content {
          padding: 24px 16px 40px;
          flex: 1;
          display: flex;
          justify-content: center;
        }
        .edit-content-inner {
          width: 100%;
          max-width: 480px;
        }
        .edit-card {
          background: rgba(250, 255, 251, 0.84);
          border-radius: 24px;
          padding: 28px 20px 24px;
          box-shadow: 0 8px 24px rgba(46, 78, 63, 0.04);
        }
        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 24px;
          margin-bottom: 24px;
          border-bottom: 1px solid #edf4ee;
        }
        .avatar-wrap {
          position: relative;
          width: 88px;
          height: 88px;
          border-radius: 50%;
          background: #e7f2eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity .2s;
        }
        .avatar-wrap:active {
          opacity: .85;
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .avatar-camera {
          position: absolute;
          right: -2px;
          bottom: -2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #dcebdc;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar-tip {
          margin-top: 10px;
          font-size: 14px;
          color: #889e90;
        }
        .form-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .form-item:last-child {
          margin-bottom: 0;
        }
        .form-label {
          font-size: 16px;
          font-weight: 500;
          color: #5a7a68;
        }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #dcebe1;
          background: transparent;
          font-size: 14px;
          color: #2e4e3f;
          outline: none;
          transition: border-color .2s;
        }
        .form-input:focus {
          border-color: #86c29d;
        }
        .form-textarea {
          width: 100%;
          min-height: 88px;
          padding: 10px 14px;
          border-radius: 12px;
          border: 1px solid #dcebe1;
          background: transparent;
          font-size: 14px;
          color: #2e4e3f;
          outline: none;
          resize: vertical;
          line-height: 1.6;
          transition: border-color .2s;
        }
        .form-textarea:focus {
          border-color: #86c29d;
        }
        .form-hint {
          font-size: 12px;
          color: #a8b9ae;
        }
      `}</style>

      <header className="edit-page-header flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="w-10 h-10 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center hover:bg-primary-light hover:text-primary transition-colors shadow-[0_2px_10px_rgba(26_59_42_0.12)] flex-shrink-0"
          style={{ color: '#2a483a' }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-medium truncate font-sans-hei edit-title" style={{ color: '#2a483a' }}>编辑资料</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || saving || loading}
          className="px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-1.5 bg-white/70 backdrop-blur-md hover:bg-primary-light hover:text-primary transition-colors shadow-[0_2px_10px_rgba(26_59_42_0.12)] flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ color: '#2a483a' }}
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </header>

      <div className="edit-content">
        <div className="edit-content-inner">
        {loading ? (
          <div className="edit-card" style={{ textAlign: 'center', color: '#889e90', fontSize: '14px' }}>
            加载中...
          </div>
        ) : (
          <div className="edit-card">
            <div className="avatar-section">
              <div className="avatar-wrap" onClick={handleAvatarClick}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="头像" className="avatar-img" />
                ) : (
                  <User size={32} style={{ color: '#2e4e3f' }} strokeWidth={1.5} />
                )}
                <div className="avatar-camera">
                  <Camera size={13} style={{ color: '#4a755e' }} strokeWidth={2} />
                </div>
              </div>
              <p className="avatar-tip">点击更换头像</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            <div className="form-item">
              <label className="form-label">昵称</label>
              <input
                className="form-input"
                type="text"
                value={username}
                maxLength={64}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入昵称"
              />
            </div>

            <div className="form-item">
              <label className="form-label">签名</label>
              <textarea
                className="form-textarea"
                value={signature}
                maxLength={200}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="写点什么吧..."
              />
              <span className="form-hint">{signature.length}/200</span>
            </div>
          </div>
        )}
        </div>
      </div>
      </div>
      <ImageEditor
        open={editorOpen}
        file={editorFile}
        initialAspect="1:1"
        onConfirm={handleEditorConfirm}
        onCancel={handleEditorCancel}
      />
    </div>
  );
};

export default ProfileEditPage;
