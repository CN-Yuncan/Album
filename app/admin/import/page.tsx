'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { 
  Check, 
  CircleIcon, 
  ChevronRight, 
  LoaderIcon,
  Loader2,
  ArrowUp,
  Folder,
  ImageIcon,
  CheckCircle,
  ExternalLink,
  Home,
  ArrowLeft,
  ArrowRight,
  FileImage,
  FolderClosed,
  Link,
  AlertCircle,
  Plus,
  X,
  ArrowLeftToLine
} from 'lucide-react'
import Image from 'next/image'

import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Input } from '~/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { fetchAlbumsList } from '~/server/db/query/albums'
import { ScrollArea } from '~/components/ui/scroll-area'
import { Badge } from '~/components/ui/badge'
import { AlbumType } from '~/types'
import {
  Checkbox
} from '~/components/ui/checkbox'
import { cn } from '~/lib/utils'
import { FileImage as FileImageIcon } from 'lucide-react'

// 添加类型定义
type StorageType = 's3' | 'r2' | 'cos' | 'alist';

type AlistStorage = {
  mount_path: string;
  [key: string]: any;
};

type FileItem = {
  name: string;
  url: string;
  size?: number;
  type?: string;
  lastModified?: string;
  [key: string]: any;
};

type DirectoryContents = {
  directories: string[];
  files: FileItem[];
};

// 在initFormValues后添加状态管理变量
type FormValues = {
  storage: string;
  s3: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    path: string;
    prefix?: string;
  };
  r2: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    path: string;
    prefix?: string;
  };
  cos: {
    secretId: string;
    secretKey: string;
    bucket: string;
    region: string;
    path: string;
    prefix?: string;
  };
  alist: {
    mountPath: string;
  };
  album: string;
  path?: string;
  prefix?: string;
};

// 在initFormValues后添加状态管理变量
const initFormValues: FormValues = {
  storage: '',
  s3: {
    endpoint: '',
    accessKey: '',
    secretKey: '',
    bucket: '',
    path: '',
    prefix: ''
          },
          r2: { 
    accessKey: '',
    secretKey: '',
    bucket: '',
    path: '',
    prefix: ''
          },
          cos: { 
    secretId: '',
    secretKey: '',
    bucket: '',
    region: '',
    path: '',
    prefix: ''
          },
          alist: { 
    mountPath: ''
  },
  album: '',
  path: '',
  prefix: ''
};

// 定义连接状态类型
type ConnectionStatus = 'unconfigured' | 'pending' | 'success' | 'error';

export default function ImportPage() {
  const [activeTab, setActiveTab] = useState('storage')
  const [albums, setAlbums] = useState<AlbumType[]>([])
  const [storageType, setStorageType] = useState<string>('s3')
  const [loading, setLoading] = useState<boolean>(false)
  const [browseLoading, setBrowseLoading] = useState<boolean>(false)
  const [directoryContents, setDirectoryContents] = useState<DirectoryContents | null>(null)
  const [currentPath, setCurrentPath] = useState<string>('')
  const [selectedImages, setSelectedImages] = useState<FileItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const [importType, setImportType] = useState<'files' | 'folder'>('files')
  const [alistStorages, setAlistStorages] = useState<AlistStorage[]>([])
  const [alistLoading, setAlistLoading] = useState<boolean>(false)
  const [statusMap, setStatusMap] = useState<any>({
    s3: { s3: true, loading: false },
    r2: { r2: true, loading: false },
    cos: { cos: true, loading: false },
    alist: { alist: true, loading: false }
  })
  const [formValues, setFormValues] = useState<FormValues>(initFormValues)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unconfigured')
  const [connectionLoading, setConnectionLoading] = useState(false);
  
  const t = useTranslations()
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // 获取相册列表
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const data = await fetchAlbumsList()
        setAlbums(data)
      } catch (error) {
        console.error('获取相册列表失败', error)
      }
    }

    fetchAlbums()
  }, [])

  // 当存储类型改变为AList时，获取AList挂载目录
  useEffect(() => {
    if (storageType === 'alist') {
      getAlistStorages()
    }
  }, [storageType])

  // 当AList存储列表改变时，自动选择存储路径
  useEffect(() => {
    if (alistStorages.length > 0 && storageType === 'alist') {
      // 自动选择第一个存储
      setFormValues(prev => ({
        ...prev,
        path: alistStorages[0].mount_path
      }))
      
      // 如果已经获取到AList存储，取消自动尝试连接，改为显示连接按钮，让用户手动点击
      // 避免自动连接时可能遇到的500错误
      /*
      if (statusMap.alist?.alist && !directoryContents) {
        setTimeout(() => {
          connectStorage()
        }, 500)
      }
      */
    }
  }, [alistStorages, storageType])

  // 检查存储是否配置
  useEffect(() => {
    checkStorageStatus()
  }, [])

  // 检查存储配置状态
  const checkStorageStatus = async () => {
    try {
      console.log('正在检查存储状态...');
      const response = await fetch('/api/open/check-storage-status')
      if (!response.ok) {
        console.error('存储状态检查API返回错误:', response.status, response.statusText);
        toast.error(`无法获取存储配置信息: ${response.statusText}`);
        return;
      }
      
      const data = await response.json()
      if (data.code === 200) {
        console.log('获取到存储状态:', data.data);
        setStatusMap(data.data)
        
        // 检查当前选择的存储是否已配置
        const currentStorage = formValues.storage as StorageType;
        if (currentStorage && data.data[currentStorage]) {
          const storageInfo = data.data[currentStorage];
          console.log(`当前存储${currentStorage}状态:`, storageInfo);
          
          // 如果有alist配置，自动填充挂载路径
          if (currentStorage === 'alist' && storageInfo.alist) {
            if (storageInfo.mount_path) {
              console.log('发现Alist挂载路径:', storageInfo.mount_path);
              setFormValues(prev => ({
                ...prev,
                path: storageInfo.mount_path
              }));
            }
          }
        }
      }
    } catch (error) {
      console.error('检查存储状态失败', error)
      toast.error('检查存储状态失败，请刷新页面重试')
    }
  }
  
  // 获取AList挂载目录
  const getAlistStorages = async () => {
    if (alistStorages.length > 0) return
    
    try {
      setAlistLoading(true)
      toast.info('正在获取 AList 挂载目录')
      
      // 检查AList是否已配置
      if (statusMap.alist && statusMap.alist.alist) {
        console.log('AList配置信息:', statusMap.alist);
      } else {
        console.warn('AList似乎未配置或配置不完整');
      }
      
      const res = await fetch('/api/v1/storage/alist/storages', {
        method: 'GET',
      });
      
      if (!res.ok) {
        throw new Error(`API请求失败: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (data?.code === 200) {
        const storages = data.data?.content || []
        console.log('获取到AList挂载目录:', storages);
        setAlistStorages(storages)
        
        // 如果有挂载目录，自动选择第一个
        if (storages.length > 0) {
          setFormValues(prev => ({
            ...prev,
            path: storages[0].mount_path
          }))
        } else {
          console.warn('未找到AList挂载目录');
          if (statusMap.alist && statusMap.alist.mount_path) {
            console.log('使用存储配置中的挂载路径:', statusMap.alist.mount_path);
            setFormValues(prev => ({
              ...prev,
              path: statusMap.alist.mount_path
            }));
          }
        }
      } else {
        console.error('获取AList挂载目录失败', data);
        toast.error(`获取AList挂载目录失败: ${data?.message || '未知错误'}`)
        
        // 尝试使用已有配置
        if (statusMap.alist && statusMap.alist.mount_path) {
          setFormValues(prev => ({
            ...prev,
            path: statusMap.alist.mount_path
          }));
        }
      }
    } catch (e) {
      console.error('获取AList挂载目录失败', e)
      toast.error(`获取AList挂载目录失败: ${e instanceof Error ? e.message : '未知错误'}`)
      
      // 尝试使用已有配置
      if (statusMap.alist && statusMap.alist.mount_path) {
        setFormValues(prev => ({
          ...prev,
          path: statusMap.alist.mount_path
        }));
      }
    } finally {
      setAlistLoading(false)
    }
  }

  // 直接连接到AList
  const directConnectAlist = async () => {
    try {
      setBrowseLoading(true);
      
      if (!formValues.path) {
        toast.error('请先指定AList挂载路径');
        setBrowseLoading(false);
        return;
      }
      
      // 确保挂载路径格式正确
      let mountPath = formValues.path;
      if (!mountPath.startsWith('/')) {
        mountPath = '/' + mountPath;
      }
      mountPath = mountPath.replace(/\/+/g, '/').replace(/\/+$/, '');
      
      // 设置要请求的目录路径
      let reqPath = mountPath;
      if (formValues.prefix) {
        reqPath = `${mountPath}/${formValues.prefix}`.replace(/\/+/g, '/');
      }
      
      // 尝试直接连接AList，跳过后端API
      try {
        // 从状态映射获取AList配置信息
        const alistInfo = statusMap.alist;
        if (!alistInfo || !alistInfo.alist) {
          throw new Error('AList存储未配置或配置不完整');
        }
        
        // 获取AList服务器地址和访问令牌
        const server_url = alistInfo.server_url || '';
        const token = alistInfo.token || '';
        
        if (!server_url) {
          throw new Error('AList服务器地址未配置');
        }
        
        // 设置超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        console.log('直接连接AList，请求路径:', reqPath);
        
        // 构建AList API URL
        const apiUrl = `${server_url}/api/fs/list`;
        
        const listResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
            'Authorization': token
        },
        body: JSON.stringify({
            path: reqPath,
            password: '',
            page: 1,
            per_page: 999,
            refresh: false
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!listResponse.ok) {
          throw new Error(`AList列表请求失败: ${listResponse.status} ${listResponse.statusText}`);
        }
        
        const listData = await listResponse.json();
        
        // 检查AList API返回结果
        if (listData.code !== 200) {
          if (listData.code === 400) {
            toast.error(`连接失败: 目录路径 "${reqPath}" 不存在或无法访问，请检查路径`);
      } else {
            toast.error(`AList API错误: ${listData.message}`);
          }
          return;
        }
        
        // 转换AList数据格式为我们的应用格式
        const contents: {
          directories: string[];
          files: Array<{
            name: string;
            url: string;
            size: number;
            type: string;
            lastModified: string;
          }>;
        } = {
          directories: [],
          files: []
        };
        
        // 处理目录和文件
        if (listData.data && listData.data.content) {
          listData.data.content.forEach((item: {
            name: string;
            is_dir: boolean;
            type: number;
            size: number;
            modified: string;
          }) => {
            const relativePath = (formValues.prefix ? formValues.prefix + '/' : '') + item.name;
            
            if (item.is_dir) {
              contents.directories.push(relativePath);
            } else if (item.type === 1) { // 图片类型
              // 构建图片URL
              const itemPath = encodeURIComponent(`${mountPath}/${relativePath}`);
              const imageUrl = `${server_url}/api/fs/get?path=${itemPath}`;
              
              contents.files.push({
                name: item.name,
                url: imageUrl,
                size: item.size,
                type: 'image', // 设置为图片类型
                lastModified: item.modified
              });
            }
          });
        }
        
        // 更新状态
        setDirectoryContents(contents);
        setCurrentPath(formValues.prefix || '');
        
        // 如果成功连接，自动转到浏览选项卡
        setActiveTab('browse');
        
        toast.success('已直接连接到AList并获取目录内容');
      } catch (error: any) {
        console.error('AList API直接连接失败', error);
        
        // 尝试备用方法 - 直接连接到AList前端
        toast.warning('尝试直接连接到AList...请确保AList配置正确');
        
        // 在这里，您可以添加直接连接到AList前端的逻辑
        // 由于API错误，我们无法测试这个功能，需要稍后修复
        
        throw error; // 重新抛出，以便在外层catch中处理
      }
      
    } catch (error: any) {
      console.error('直接连接AList失败', error);
      
      if (error.name === 'AbortError') {
        toast.error('连接超时，请检查AList服务器是否可访问');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('无法连接到AList服务器，请检查网络连接和服务器地址');
      } else if (error.message.includes('SyntaxError')) {
        toast.error('AList API返回格式错误，请检查您的AList配置');
      } else {
        toast.error(`连接失败: ${error.message}`);
      }
    } finally {
      setBrowseLoading(false);
    }
  };

  // 表单字段变更处理
  const handleFormChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [storageType, storageField] = field.split('.');
      setFormValues((prev) => ({
        ...prev,
        [storageType]: {
          ...prev[storageType as StorageType],
          [storageField]: value
        }
      }));
      
      // 当配置变更时重置连接状态
      if (['s3', 'r2', 'cos', 'alist'].includes(storageType)) {
        setConnectionStatus('unconfigured');
      }
    } else {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    }
  }

  // 验证表单是否有效
  const isFormValid = () => {
    const storageType = formValues.storage as StorageType;
    if (!storageType) return false;
    
    switch (storageType) {
      case 'alist':
        // 如果表单或系统配置中有路径，就算有效
        return !!(formValues.path || 
               (formValues.alist?.mountPath) || 
               (statusMap.alist?.mount_path));
      case 's3':
        return true; // 这里可根据实际要求添加详细验证
      case 'r2':
        return true; // 这里可根据实际要求添加详细验证
      case 'cos':
        return true; // 这里可根据实际要求添加详细验证
      default:
        return false;
    }
  }

  // 连接存储并浏览
  const connectStorage = async () => {
    setBrowseLoading(true);
    
    try {
      const storageType = formValues.storage as StorageType;
      console.log(`正在连接${storageType}存储...`);
      
      // 检查配置是否完整
      if (!checkStorageConfig(storageType, formValues)) {
        console.error(`${storageType}配置不完整，无法连接`);
        
        if (storageType === 'alist' && statusMap.alist && statusMap.alist.alist) {
          console.log('尝试使用系统配置的AList设置');
          // 使用系统配置的AList信息
          const mountPath = statusMap.alist.mount_path;
          if (mountPath) {
            setFormValues(prev => ({
              ...prev,
              path: mountPath
            }));
            toast.info('已自动填充AList挂载路径，请重试');
          } else {
            toast.error('系统配置的AList缺少挂载路径，请手动填写');
          }
        } else {
          toast.error('请先完成存储配置');
        }
        setBrowseLoading(false);
        return;
      }
      
      // 确保路径格式正确
      let path = '';
      if (storageType === 'alist') {
        if (formValues.alist?.mountPath) {
          path = formValues.alist.mountPath;
        } else if (formValues.path) {
          path = formValues.path;
        } else if (statusMap.alist && statusMap.alist.mount_path) {
          path = statusMap.alist.mount_path;
        }
        
        if (!path) {
          toast.error('缺少AList挂载路径，请先填写或在存储设置中配置');
          setBrowseLoading(false);
          return;
        }
        
        if (!path.startsWith('/')) {
          path = '/' + path;
        }
      } else {
        path = formValues.path || '';
      }
      
      // 设置超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      // 记录请求详情以便调试
      console.log('发送浏览目录请求:', {
        storage: storageType,
        path,
        prefix: formValues.prefix
      });
      
      const response = await fetch('/api/open/storage/browse-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage: storageType,
          path,
          prefix: formValues.prefix
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // 日志记录响应状态
      console.log('浏览目录响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 500) {
          if (storageType === 'alist') {
            throw new Error('AList连接失败，可能是挂载路径错误或配置不正确。请尝试使用"直接连接AList"按钮。');
      } else {
            throw new Error(`服务器错误 (${response.status}): 无法连接到存储`);
          }
        } else {
          throw new Error(`请求失败 (${response.status}): ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('浏览目录响应数据:', data);
      
      if (data.code !== 200) {
        throw new Error(data.message || '获取目录内容失败');
      }
      
      // 更新状态
      setDirectoryContents({
        directories: data.data.directories || [],
        files: data.data.files || []
      });
      setCurrentPath(formValues.prefix || '');
      
      // 自动切换到浏览标签
      setActiveTab('browse');
    } catch (error: any) {
      console.error('连接存储失败', error);
      
      if (error.name === 'AbortError') {
        toast.error('请求超时，请检查存储服务是否可访问');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('无法连接到服务器，请检查网络连接');
      } else {
        toast.error(`连接失败: ${error.message}`);
      }
    } finally {
      setBrowseLoading(false);
    }
  };

  // 进入目录
  const enterDirectory = async (directory: string) => {
    try {
      setBrowseLoading(true);
      
      // 验证路径
      if (!directory) {
        toast.error('目录路径无效');
        setBrowseLoading(false);
        return;
      }
      
      // 设置超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      // 记录请求细节
      console.log('进入目录请求:', {
        storage: formValues.storage,
        path: formValues.path,
        prefix: directory
      });
      
      // 确保AList挂载路径格式正确
      let path = formValues.path || '';
      if (formValues.storage === 'alist' && !path.startsWith('/')) {
        path = '/' + path;
      }
      
      const response = await fetch('/api/open/storage/browse-directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage: formValues.storage,
          path,
          prefix: directory
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // 日志记录响应状态
      console.log('进入目录响应状态:', response.status, response.statusText);
      
      if (!response.ok) {
        if (response.status === 500) {
          throw new Error(`服务器错误 (${response.status}): 无法访问目录。如果使用AList，请尝试"直接连接AList"按钮。`);
    } else {
          throw new Error(`请求失败 (${response.status}): ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      console.log('进入目录响应数据:', data);
      
      if (data.code !== 200) {
        throw new Error(data.message || '获取目录内容失败');
      }
      
      // 更新状态和UI
      setDirectoryContents({
        directories: data.data.directories || [],
        files: data.data.files || []
      });
      setCurrentPath(directory);
      
      // 重置选择
      setSelectedImages([]);
      setSelectedFolder('');
    } catch (error: any) {
      console.error('进入目录失败', error);
      
      if (error.name === 'AbortError') {
        toast.error('请求超时，请检查存储服务是否可访问');
      } else if (error.message.includes('Failed to fetch')) {
        toast.error('无法连接到服务器，请检查网络连接');
      } else {
        toast.error(`目录访问失败: ${error.message}`);
      }
    } finally {
      setBrowseLoading(false);
    }
  };

  // 返回上级目录
  const goToParentDirectory = () => {
    if (!currentPath) return

    const pathParts = currentPath.split('/')
    pathParts.pop()
    const parentPath = pathParts.join('/')
    enterDirectory(parentPath)
  }

  // 处理图片选择
  const toggleImageSelection = (image: FileItem | string) => {
    // 获取URL，支持直接传入对象或URL字符串
    const imageUrl = typeof image === 'string' ? image : image.url;
    
    if (selectedImages.some(img => img.url === imageUrl)) {
      setSelectedImages(selectedImages.filter(img => img.url !== imageUrl))
    } else {
      const imageToAdd = directoryContents?.files.find((file: FileItem) => file.url === imageUrl)
      if (imageToAdd) {
        setSelectedImages([...selectedImages, imageToAdd])
      }
    }
  }

  // 处理文件夹选择
  const selectFolder = (folderPath: string) => {
    if (selectedFolder === folderPath) {
      setSelectedFolder('')
    } else {
      setSelectedFolder(folderPath)
    }
  }

  // 继续到选择相册步骤
  const goToAlbumSelection = () => {
    if (importType === 'files' && selectedImages.length === 0) {
      toast.warning(t('Import.noImagesSelected'))
      return
    }
    
    if (importType === 'folder' && !selectedFolder) {
      toast.warning('请选择要导入的文件夹')
      return
    }
    
    setActiveTab('album')
  }

  // 导入图片到相册
  const importImages = async () => {
    try {
      setLoading(true)
      
      if (!formValues.album) {
        toast.warning(t('Import.selectAlbum'))
        return
      }
      
      if (importType === 'files') {
      if (selectedImages.length === 0) {
          toast.warning(t('Import.noImagesSelected'))
        return
      }
      
        const response = await fetch('/api/open/images/import', {
        method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: selectedImages, album: formValues.album })
        })

        const data = await response.json()
        if (data.code === 200) {
          toast.success(`${t('Import.importSuccess')}: ${data.data}/${selectedImages.length}`)
        setSelectedImages([])
          // 导入成功后重置状态
          resetState()
      } else {
          toast.error(data.message || t('Import.importFailed'))
        }
      } else if (importType === 'folder') {
        if (!selectedFolder) {
          toast.warning('请选择要导入的文件夹')
        return
      }
      
        // 导入文件夹中的所有图片
        const response = await fetch('/api/open/storage/browse-directory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            storage: formValues.storage, 
            path: formValues.path, 
            prefix: selectedFolder 
          })
        })

        const data = await response.json()
        if (data.code === 200 && data.data.files && data.data.files.length > 0) {
          const importResponse = await fetch('/api/open/images/import', {
        method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
              images: data.data.files, 
              album: formValues.album 
            })
          })

          const importData = await importResponse.json()
          if (importData.code === 200) {
            toast.success(`${t('Import.importSuccess')}: ${importData.data}/${data.data.files.length}`)
            // 导入成功后重置状态
            resetState()
          } else {
            toast.error(importData.message || t('Import.importFailed'))
          }
      } else {
          toast.error('文件夹中没有可导入的图片')
        }
      }
    } catch (error) {
      console.error('导入图片失败', error)
      toast.error(t('Import.importFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 重置状态
  const resetState = () => {
    setActiveTab('storage')
    setSelectedImages([])
    setSelectedFolder('')
    setDirectoryContents(null)
    setCurrentPath('')
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (directoryContents && directoryContents.files) {
      if (selectedImages.length === directoryContents.files.length) {
        setSelectedImages([])
      } else {
        setSelectedImages([...directoryContents.files])
      }
    }
  }

  // 渲染目录列表
  const renderDirectories = () => {
    if (!directoryContents || !directoryContents.directories) return null

  return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-medium">{t('Import.currentDirectory')}: {currentPath || '/'}</div>
          {currentPath && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToParentDirectory}
              disabled={browseLoading}
            >
              <ArrowUp className="mr-1 h-4 w-4" />
              {t('Import.parentDirectory')}
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px] pr-4 rounded-md border">
          <div className="p-4">
            {directoryContents && directoryContents.directories && directoryContents.directories.map((dir: string, index: number) => {
              const dirName = dir.split('/').filter(Boolean).pop()
              const isSelected = importType === 'folder' && selectedFolder === dir

  return (
                <div 
                  key={index}
                  className={`p-3 mb-2 border rounded flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-accent'}`}
                  onClick={importType === 'folder' ? () => selectFolder(dir) : () => enterDirectory(dir)}
                >
                  <div className="flex items-center">
                    <Folder className="mr-2 h-4 w-4 text-amber-500" />
                    <span className="truncate">{dirName}</span>
                  </div>
                  
                  {importType === 'folder' ? (
                    isSelected ? <CheckCircle className="h-4 w-4 text-primary" /> : null
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </div>
    )
  }

  // 渲染文件列表
  const renderFiles = () => {
    if (importType === 'folder') return null;
    
    if (!directoryContents || !directoryContents.files || directoryContents.files.length === 0) {
      return <div className="text-center py-4 text-muted-foreground">{t('Tips.noImg')}</div>
    }

    return (
      <div>
        <div className="flex justify-between mb-4">
          <div className="text-lg font-medium">{t('Import.selectImages')}</div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleSelectAll}
          >
            {selectedImages.length === directoryContents.files.length ? 
              '取消全选' : 
              '全选'
            }
          </Button>
        </div>
        
        <div ref={imageContainerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {directoryContents.files.map((file: FileItem, index: number) => {
            const isSelected = selectedImages.some(img => img.url === file.url)
            return (
              <div 
                key={index} 
                className={`border rounded overflow-hidden cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => toggleImageSelection(file)}
              >
                <div className="aspect-square relative">
                  <img 
                    src={file.url} 
                    alt={file.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <div className="p-2 text-sm truncate flex items-center">
                  <Checkbox 
                    checked={isSelected}
                    className="mr-2"
                    onCheckedChange={() => toggleImageSelection(file)}
                  />
                  <span className="truncate">{file.name}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染已选内容信息
  const renderSelectionInfo = () => {
    if ((importType === 'files' && selectedImages.length === 0) || (importType === 'folder' && !selectedFolder)) {
      return null
    }

    return (
      <div className="mt-6">
        {importType === 'files' && selectedImages.length > 0 && (
          <div className="text-lg font-medium mb-2">{t('Import.selectedImages')}: {selectedImages.length}</div>
        )}
        
        {importType === 'folder' && selectedFolder && (
          <div className="text-lg font-medium mb-2">已选文件夹: {selectedFolder.split('/').filter(Boolean).pop()}</div>
        )}
      </div>
    )
  }

  // 重新添加testConnection函数，它被错误地删除了
  const testConnection = async () => {
    setConnectionLoading(true);
    setConnectionStatus('pending');
    
    const isConfigValid = checkStorageConfig(formValues.storage as StorageType, formValues);
    
    if (!isConfigValid) {
      toast.error('请先完成存储配置');
      setConnectionLoading(false);
      setConnectionStatus('error');
      return;
    }
    
    try {
      // 测试连接存储
      await connectStorage();
      setConnectionStatus('success');
      toast.success(`${formValues.storage.toUpperCase()} 连接成功`);
    } catch (error) {
      console.error(`测试连接出错:`, error);
      setConnectionStatus('error');
      toast.error(`连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setConnectionLoading(false);
    }
  };

  // 渲染存储选择界面
  const renderStorageSelection = () => {
    // 检查是否有系统配置的存储
    const hasAlistConfig = statusMap.alist && statusMap.alist.alist;
    const hasCosConfig = statusMap.cos && statusMap.cos.cos;
    const hasS3Config = statusMap.s3 && statusMap.s3.s3;
    const hasR2Config = statusMap.r2 && statusMap.r2.r2;
    
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="storage">存储类型</Label>
          <Select 
            value={formValues.storage} 
            onValueChange={handleStorageTypeChange}
          >
            <SelectTrigger id="storage" className="w-full bg-background">
              <SelectValue placeholder={t('Import.selectStorage')} />
            </SelectTrigger>
            <SelectContent position="popper" style={{ zIndex: 999 }}>
              <SelectItem value="s3" className="flex items-center justify-between">
                <div className="flex items-center">
                  <span>S3/阿里云OSS</span>
                  {hasS3Config && <Check size={16} className="ml-2 text-green-500" />}
                </div>
              </SelectItem>
              <SelectItem value="r2" className="flex items-center justify-between">
                <div className="flex items-center">
                  <span>Cloudflare R2</span>
                  {hasR2Config && <Check size={16} className="ml-2 text-green-500" />}
                </div>
              </SelectItem>
              <SelectItem value="cos" className="flex items-center justify-between">
                <div className="flex items-center">
                  <span>腾讯云COS</span>
                  {hasCosConfig && <Check size={16} className="ml-2 text-green-500" />}
                </div>
              </SelectItem>
              <SelectItem value="alist" className="flex items-center justify-between">
                <div className="flex items-center">
                  <span>AList</span>
                  {hasAlistConfig && <Check size={16} className="ml-2 text-green-500" />}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {formValues.storage && (
          <div className="text-sm bg-muted/40 rounded-md p-3">
            <div className="flex items-center">
              <div className="flex-1">
                {formValues.storage === 's3' && (
                  <span>S3/阿里云OSS 配置状态: {hasS3Config ? 
                    <span className="text-green-500">已配置</span> : 
                    <span className="text-orange-500">未配置或不完整</span>}
                  </span>
                )}
                {formValues.storage === 'r2' && (
                  <span>Cloudflare R2 配置状态: {hasR2Config ? 
                    <span className="text-green-500">已配置</span> : 
                    <span className="text-orange-500">未配置或不完整</span>}
                  </span>
                )}
                {formValues.storage === 'cos' && (
                  <span>腾讯云COS 配置状态: {hasCosConfig ? 
                    <span className="text-green-500">已配置</span> : 
                    <span className="text-orange-500">未配置或不完整</span>}
                  </span>
                )}
                {formValues.storage === 'alist' && (
                  <span>AList 配置状态: {hasAlistConfig ? 
                    <span className="text-green-500">已配置</span> : 
                    <span className="text-orange-500">未配置或不完整</span>}
                  </span>
                )}
              </div>
              {formValues.storage === 'cos' && (
                <Button 
                  onClick={testCOSConnection} 
                  variant="outline" 
                  size="sm"
                  className="ml-2"
                >
                  测试COS连接
            </Button>
              )}
            </div>
            {formValues.storage === 'alist' && hasAlistConfig && statusMap.alist?.mount_path && (
              <div className="mt-1 text-muted-foreground">
                系统配置的挂载路径: {statusMap.alist.mount_path}
              </div>
            )}
          </div>
        )}
        
        {formValues.storage === 'alist' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="path" className="flex items-center">
                AList挂载路径
                {hasAlistConfig && <Badge variant="outline" className="ml-2 text-xs">已配置</Badge>}
              </Label>
              
              {alistLoading ? (
                <div className="flex items-center space-x-2">
                  <Input name="path" placeholder="/WebDAV" value={formValues.path} disabled />
                  <Loader2 className="animate-spin h-5 w-5" />
                </div>
              ) : alistStorages && alistStorages.length > 0 ? (
                <Select
                  name="path" 
                  value={formValues.path || ''} 
                  onValueChange={val => setFormValues(prev => ({ ...prev, path: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择挂载路径" />
                  </SelectTrigger>
                  <SelectContent className="z-[999]">
                    <SelectGroup>
                      <SelectLabel>可用挂载</SelectLabel>
                      {alistStorages.map((store, idx) => (
                        <SelectItem key={idx} value={store.mount_path}>
                          {store.mount_path}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input 
                    name="path" 
                    placeholder="/WebDAV" 
                    value={formValues.path} 
                    onChange={(e) => handleFormChange('path', e.target.value)} 
                  />
                  {statusMap.alist?.mount_path && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormValues(prev => ({
                          ...prev,
                          path: statusMap.alist?.mount_path || ''
                        }));
                      }}
                    >
                      使用系统配置路径
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prefix">路径前缀 (可选)</Label>
              <Input 
                name="prefix" 
                placeholder="photos/2023" 
                value={formValues.prefix} 
                onChange={(e) => handleFormChange('prefix', e.target.value)} 
              />
              <p className="text-sm text-muted-foreground">如需从特定子目录开始浏览，请指定路径前缀</p>
            </div>
            </div>
          )}

        {(formValues.storage === 's3' || formValues.storage === 'r2' || formValues.storage === 'cos') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="prefix">前缀 (可选)</Label>
              <Input 
                name="prefix" 
                placeholder="photos/2023" 
                value={formValues.prefix} 
                onChange={(e) => handleFormChange('prefix', e.target.value)} 
              />
            </div>
          </>
        )}
        
        <div className="flex space-x-2">
          <Button 
            onClick={connectStorage} 
            disabled={browseLoading || !isFormValid()}
            className="flex items-center"
          >
            {browseLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link className="mr-2 h-4 w-4" />}
            连接并浏览
                  </Button>
          
          {formValues.storage === 'alist' && (
            <Button 
              onClick={directConnectAlist} 
              disabled={browseLoading || !formValues.path}
              variant="outline"
              className="flex items-center"
            >
              {browseLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
              直接连接AList
                  </Button>
          )}
                </div>
              </div>
    );
  };

  // 渲染浏览界面
  const renderBrowse = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => enterDirectory('')}
            disabled={browseLoading || !currentPath}
          >
            <Home className="h-4 w-4 mr-2" />
            根目录
          </Button>
          <div className="flex-1 overflow-hidden">
            <Input 
              value={currentPath} 
              readOnly 
              className="bg-muted/50"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium">选择导入方式</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div 
              className={cn(
                "flex items-center justify-center p-4 border rounded-md cursor-pointer hover:bg-accent/50",
                importType === 'files' && "border-primary bg-accent"
              )}
              onClick={() => setImportType('files')}
            >
              <div className="text-center">
                <FileImageIcon className="h-6 w-6 mx-auto mb-2" />
                <p>选择单个图片</p>
              </div>
            </div>
            <div 
              className={cn(
                "flex items-center justify-center p-4 border rounded-md cursor-pointer hover:bg-accent/50",
                importType === 'folder' && "border-primary bg-accent"
              )}
              onClick={() => setImportType('folder')}
            >
              <div className="text-center">
                <Folder className="h-6 w-6 mx-auto mb-2" />
                <p>导入整个文件夹</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{importType === 'files' ? '可用图片' : '可用目录'}</h3>
            
            {browseLoading && (
              <div className="flex items-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>加载中...</span>
            </div>
          )}
          </div>
          
          <ScrollArea className="h-[300px] border rounded-md">
            {importType === 'folder' ? (
              <div className="p-4">
                {directoryContents && directoryContents.directories && directoryContents.directories.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {directoryContents.directories.map((dir, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center p-2 rounded-md cursor-pointer hover:bg-accent/50",
                          selectedFolder === dir && "bg-accent border-primary"
                        )}
                        onClick={() => setSelectedFolder(dir)}
                        onDoubleClick={() => enterDirectory(dir)}
                      >
                        <Folder className="h-4 w-4 mr-2 shrink-0" />
                        <span className="truncate">{dir.split('/').pop()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
                    <FolderClosed className="h-8 w-8 mb-2" />
                    <p>当前目录下没有子目录</p>
                </div>
                )}
              </div>
            ) : (
              <div className="p-4">
                {directoryContents && directoryContents.files && directoryContents.files.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {directoryContents.files.map((file, idx) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "relative aspect-square rounded-md border overflow-hidden cursor-pointer hover:opacity-90",
                          selectedImages.some(img => img.url === file.url) && "ring-2 ring-primary"
                        )}
                        onClick={() => toggleImageSelection(file)}
                      >
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover bg-accent"
                        />
                        {selectedImages.some(img => img.url === file.url) && (
                          <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-3 w-3" />
                        </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
                    <FileImageIcon className="h-8 w-8 mb-2" />
                    <p>当前目录下没有图片</p>
                        </div>
                )}
            </div>
          )}
          </ScrollArea>
        </div>
        
        {renderSelectionInfo()}
        
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setActiveTab('storage')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <Button 
            onClick={() => setActiveTab('album')} 
            disabled={
              (importType === 'files' && selectedImages.length === 0) || 
              (importType === 'folder' && !selectedFolder)
            }
          >
            下一步
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  // 在S3输入字段部分添加测试连接按钮和状态显示
  const getConnectionStatusBadge = (type: StorageType) => {
    const status = connectionStatus === 'pending' ? 'pending' : 
                   connectionStatus === 'success' ? 'success' : 
                   connectionStatus === 'error' ? 'error' : 'unconfigured';
    
    switch (status) {
      case 'success':
        return <span className="flex items-center text-green-500"><Check size={16} className="mr-1" /> 已连接</span>;
      case 'pending':
        return <span className="flex items-center text-orange-500"><Loader2 size={16} className="mr-1 animate-spin" /> 连接中</span>;
      case 'error':
        return <span className="flex items-center text-red-500"><AlertCircle size={16} className="mr-1" /> 连接失败</span>;
      default:
        return <span className="flex items-center text-gray-400"><X size={16} className="mr-1" /> 未配置</span>;
    }
  };

  // 添加测试腾讯云COS连接的函数
  const testCOSConnection = async () => {
    try {
      toast.info('正在测试腾讯云COS连接...');
      console.log('测试COS连接状态...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      // 获取当前COS配置
      const cosConfig = {
        secretId: formValues.cos.secretId || '',
        secretKey: formValues.cos.secretKey || '',
        bucket: formValues.cos.bucket || '',
        region: formValues.cos.region || ''
      };
      
      // 记录请求信息（注意隐藏敏感信息）
      console.log('COS连接测试请求:', {
        bucket: cosConfig.bucket,
        region: cosConfig.region,
        secretId: cosConfig.secretId ? '已设置' : '未设置',
        secretKey: cosConfig.secretKey ? '已设置' : '未设置'
      });
      
      const response = await fetch('/api/open/storage/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage: 'cos',
          config: cosConfig
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('COS连接测试响应:', {
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        toast.error(`腾讯云COS连接测试失败: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      console.log('COS连接测试结果:', data);
      
      if (data.code === 200 && data.success) {
        toast.success('腾讯云COS连接测试成功!');
                              } else {
        toast.error(`腾讯云COS连接测试失败: ${data.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('测试腾讯云COS连接出错:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          toast.error('腾讯云COS连接测试超时，请检查网络或COS配置');
        } else {
          toast.error(`腾讯云COS连接测试失败: ${error.message}`);
        }
      } else {
        toast.error('腾讯云COS连接测试失败，请检查配置');
      }
    }
  }

  // 添加检查存储配置函数
  const checkStorageConfig = (type: StorageType, values: FormValues): boolean => {
    if (!type) return false;
    
    // 检查系统配置
    const systemConfig = statusMap[type];
    const hasSystemConfig = systemConfig && systemConfig[type]; // 例如statusMap.alist.alist
    
    switch (type) {
      case 's3':
        // 检查表单中的值
        const hasS3FormConfig = !!values.s3.endpoint && !!values.s3.accessKey && 
                              !!values.s3.secretKey && !!values.s3.bucket;
        return hasS3FormConfig || hasSystemConfig;
        
      case 'r2':
        const hasR2FormConfig = !!values.r2.accessKey && !!values.r2.secretKey && 
                              !!values.r2.bucket;
        return hasR2FormConfig || hasSystemConfig;
        
      case 'cos':
        const hasCOSFormConfig = !!values.cos.secretId && !!values.cos.secretKey && 
                               !!values.cos.bucket && !!values.cos.region;
        return hasCOSFormConfig || hasSystemConfig;
        
      case 'alist':
        // 对于AList，我们检查表单值或系统配置
        const hasAlistPath = !!values.path || !!values.alist.mountPath || 
                          (systemConfig && !!systemConfig.mount_path);
        return hasAlistPath && hasSystemConfig;
        
      default:
        return false;
    }
  };

  // 修改tabChange处理，确保切换存储类型时更新表单
  const handleStorageTypeChange = (value: string) => {
    // 更新表单的存储类型
    handleFormChange('storage', value);
    
    // 自动填充系统配置
    const storageType = value as StorageType;
    const systemConfig = statusMap[storageType];
    
    if (systemConfig && systemConfig[storageType]) {
      console.log(`发现${storageType}系统配置:`, systemConfig);
      
      if (storageType === 'alist' && systemConfig.mount_path) {
        // 如果是AList且系统配置中有挂载路径，自动填充
        setFormValues(prev => ({
          ...prev,
          path: systemConfig.mount_path
        }));
      }
      
      // 可以根据需要为其他存储类型添加自动填充逻辑
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('Import.title')}</CardTitle>
          <CardDescription>
            导入存储中的图片到相册，无需重新上传
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="storage">1. 选择存储</TabsTrigger>
              <TabsTrigger value="browse" disabled={!directoryContents}>2. 浏览文件</TabsTrigger>
              <TabsTrigger value="album" disabled={importType === 'files' ? selectedImages.length === 0 : !selectedFolder}>3. 选择相册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="storage" className="mt-4 space-y-6">
              {renderStorageSelection()}
            </TabsContent>
            
            <TabsContent value="browse" className="mt-4 space-y-6">
              {renderBrowse()}
            </TabsContent>
            
            <TabsContent value="album" className="mt-4 space-y-6">
              <div>
                <Label htmlFor="album" className="block mb-2">{t('Import.targetAlbum')}</Label>
                <Select 
                  value={formValues.album} 
                  onValueChange={(value) => handleFormChange('album', value)}
                >
                  <SelectTrigger id="album" className="w-full bg-background">
                    <SelectValue placeholder={t('Import.selectAlbum')} />
                  </SelectTrigger>
                  <SelectContent position="popper" style={{ zIndex: 999 }}>
                    {albums.map((album) => (
                      <SelectItem key={album.id} value={album.album_value}>{album.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
              
              <div className="bg-muted/50 p-4 rounded-md">
                <div className="text-lg font-medium mb-2">导入信息确认</div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>存储类型：{storageType === 's3' ? 'S3/阿里云OSS' : storageType === 'r2' ? 'Cloudflare R2' : storageType === 'cos' ? '腾讯云COS' : 'AList'}</p>
                  {importType === 'files' && (
                    <p>已选图片数量：{selectedImages.length}</p>
                  )}
                  {importType === 'folder' && (
                    <p>已选文件夹：{selectedFolder.split('/').filter(Boolean).pop()}</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
          <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('browse')}
                >
                  返回
                </Button>
                
                <Button 
            onClick={importImages} 
                  disabled={!formValues.album || loading}
          >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('Import.importImages')}
          </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        </Card>

      {browseLoading && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>正在加载...</p>
          </div>
        </div>
      )}
    </div>
  )
} 