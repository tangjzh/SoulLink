import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Divider,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Chat,
  Delete,
  Visibility,
  Psychology,
  CalendarToday,
  Schedule,
  Category,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  getConversations,
  getConversationMessages,
  Conversation,
  Message,
} from '../services/api';

interface ConversationWithStats extends Conversation {
  messageCount?: number;
  lastMessage?: string;
  duration?: string;
}

const ConversationHistory: React.FC = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [conversations, setConversations] = useState<ConversationWithStats[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  
  // 对话框状态
  const [previewDialog, setPreviewDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithStats | null>(null);
  const [previewMessages, setPreviewMessages] = useState<Message[]>([]);
  
  // 菜单状态
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuConversation, setMenuConversation] = useState<ConversationWithStats | null>(null);

  // 加载对话记录
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const conversationsData = await getConversations();
        
        // 为每个对话获取统计信息
        const conversationsWithStats = await Promise.all(
          conversationsData.map(async (conv) => {
            try {
              const messages = await getConversationMessages(conv.id);
              const lastMessage = messages[messages.length - 1];
              
              return {
                ...conv,
                messageCount: messages.length,
                lastMessage: lastMessage ? 
                  (lastMessage.content.length > 50 ? 
                    lastMessage.content.substring(0, 50) + '...' : 
                    lastMessage.content) : 
                  '暂无消息',
                duration: calculateDuration(conv.created_at),
              };
            } catch {
              return {
                ...conv,
                messageCount: 0,
                lastMessage: '无法加载消息',
                duration: calculateDuration(conv.created_at),
              };
            }
          })
        );
        
        setConversations(conversationsWithStats);
        setFilteredConversations(conversationsWithStats);
      } catch (err: any) {
        setError('加载对话记录失败：' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  // 搜索和筛选效果
  useEffect(() => {
    let filtered = [...conversations];

    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(conv =>
        conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 按分类筛选
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(conv => conv.scenario.category === categoryFilter);
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'messages_desc':
          return (b.messageCount || 0) - (a.messageCount || 0);
        case 'messages_asc':
          return (a.messageCount || 0) - (b.messageCount || 0);
        default:
          return 0;
      }
    });

    setFilteredConversations(filtered);
  }, [conversations, searchTerm, categoryFilter, sortBy]);

  // 计算时间差
  const calculateDuration = (createdAt: string): string => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}天前`;
    if (diffHours > 0) return `${diffHours}小时前`;
    if (diffMinutes > 0) return `${diffMinutes}分钟前`;
    return '刚刚';
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取唯一分类
  const getCategories = () => {
    const categories = Array.from(new Set(conversations.map(conv => conv.scenario.category)));
    return categories;
  };

  // 处理菜单操作
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, conversation: ConversationWithStats) => {
    setAnchorEl(event.currentTarget);
    setMenuConversation(conversation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuConversation(null);
  };

  // 继续对话
  const handleContinueChat = (conversation: ConversationWithStats) => {
    // 这里需要传递对话ID到聊天页面
    // 暂时导航到聊天页面，实际需要修改Chat组件支持恢复对话
    navigate(`/chat/${conversation.id}/continue`);
  };

  // 预览对话
  const handlePreviewConversation = async (conversation: ConversationWithStats) => {
    try {
      const messages = await getConversationMessages(conversation.id);
      setPreviewMessages(messages);
      setSelectedConversation(conversation);
      setPreviewDialog(true);
    } catch (err: any) {
      setError('加载对话详情失败：' + err.message);
    }
    handleMenuClose();
  };

  // 删除对话
  const handleDeleteConversation = (conversation: ConversationWithStats) => {
    setSelectedConversation(conversation);
    setDeleteDialog(true);
    handleMenuClose();
  };

  const confirmDeleteConversation = async () => {
    if (!selectedConversation) return;

    try {
      // TODO: 实现删除API
      console.log('删除对话:', selectedConversation.id);
      
      // 从列表中移除
      setConversations(prev => prev.filter(conv => conv.id !== selectedConversation.id));
      setDeleteDialog(false);
      setSelectedConversation(null);
    } catch (err: any) {
      setError('删除对话失败：' + err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          加载对话记录中...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 页面标题 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          对话记录
        </Typography>
        <Typography variant="body1" color="text.secondary">
          查看和管理你的历史对话记录
        </Typography>
      </Box>

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 搜索和筛选工具栏 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="搜索对话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>分类筛选</InputLabel>
                <Select
                  value={categoryFilter}
                  label="分类筛选"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">全部分类</MenuItem>
                  {getCategories().map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>排序方式</InputLabel>
                <Select
                  value={sortBy}
                  label="排序方式"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="date_desc">最新创建</MenuItem>
                  <MenuItem value="date_asc">最早创建</MenuItem>
                  <MenuItem value="messages_desc">消息最多</MenuItem>
                  <MenuItem value="messages_asc">消息最少</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                共 {filteredConversations.length} 条记录
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 对话列表 */}
      {filteredConversations.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Psychology sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="text.secondary">
            {searchTerm || categoryFilter !== 'all' ? '没有找到匹配的对话' : '还没有对话记录'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {searchTerm || categoryFilter !== 'all' ? 
              '尝试调整搜索条件或筛选器' : 
              '开始与你的数字人格对话，创建第一条记录吧'
            }
          </Typography>
          {!searchTerm && categoryFilter === 'all' && (
            <Button
              variant="contained"
              onClick={() => navigate('/personas')}
              size="large"
            >
              创建对话
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredConversations.map((conversation) => (
            <Grid item xs={12} key={conversation.id}>
              <Card
                sx={{
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      {/* 对话标题和场景 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <Psychology />
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="h3">
                            {conversation.title || conversation.scenario.name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={conversation.scenario.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={conversation.scenario.difficulty_level}
                              size="small"
                              color={
                                conversation.scenario.difficulty_level === 'easy'
                                  ? 'success'
                                  : conversation.scenario.difficulty_level === 'medium'
                                  ? 'warning'
                                  : 'error'
                              }
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* 场景描述 */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {conversation.scenario.description}
                      </Typography>

                      {/* 最后消息 */}
                      {conversation.lastMessage && (
                        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            最后消息：
                          </Typography>
                          <Typography variant="body2">
                            {conversation.lastMessage}
                          </Typography>
                        </Box>
                      )}

                      {/* 统计信息 */}
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chat fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {conversation.messageCount || 0} 条消息
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {conversation.duration}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(conversation.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* 操作按钮 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<Chat />}
                        onClick={() => handleContinueChat(conversation)}
                      >
                        继续对话
                      </Button>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, conversation)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handlePreviewConversation(menuConversation!)}>
          <Visibility sx={{ mr: 1 }} />
          预览对话
        </MenuItem>
        <MenuItem onClick={() => handleDeleteConversation(menuConversation!)}>
          <Delete sx={{ mr: 1 }} />
          删除对话
        </MenuItem>
      </Menu>

      {/* 对话预览对话框 */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          对话预览
          {selectedConversation && (
            <Typography variant="subtitle2" color="text.secondary">
              {selectedConversation.scenario.name} - {formatDate(selectedConversation.created_at)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {previewMessages.map((message, index) => (
              <ListItem key={message.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: message.sender_type === 'user' ? 'primary.main' : 'secondary.main' }}>
                    {message.sender_type === 'user' ? '👤' : '🤖'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={message.content}
                  secondary={formatDate(message.created_at)}
                />
              </ListItem>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>关闭</Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewDialog(false);
              handleContinueChat(selectedConversation!);
            }}
          >
            继续对话
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除这个对话记录吗？此操作无法恢复。
          </Typography>
          {selectedConversation && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              对话：{selectedConversation.title || selectedConversation.scenario.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>取消</Button>
          <Button
            onClick={confirmDeleteConversation}
            color="error"
            variant="contained"
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationHistory; 