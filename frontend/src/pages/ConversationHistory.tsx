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
  Pagination,
  useTheme,
  useMediaQuery,
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
  getConversationsPaginated,
  getConversationMessages,
  Conversation,
  ConversationWithStats,
  PaginatedConversationsResponse,
  Message,
} from '../services/api';



const ConversationHistory: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // 状态管理
  const [conversationsData, setConversationsData] = useState<PaginatedConversationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  
  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // 分类数据
  const [categories, setCategories] = useState<string[]>([]);
  
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
    loadConversations();
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, sortBy]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getConversationsPaginated({
        page: currentPage,
        size: itemsPerPage,
        search: searchTerm || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        sort_by: sortBy,
      });
      
      setConversationsData(data);
      
      // 更新分类列表（仅在第一次加载时）
      if (!categories.length && data.conversations.length > 0) {
        const uniqueCategories = Array.from(
          new Set(data.conversations.map(conv => conv.scenario.category))
        );
        setCategories(uniqueCategories);
      }
    } catch (err: any) {
      setError('加载对话记录失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 当搜索或筛选条件改变时重置到第一页
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, categoryFilter, sortBy]);

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
      
      // 重新加载数据
      await loadConversations();
      setDeleteDialog(false);
      setSelectedConversation(null);
    } catch (err: any) {
      setError('删除对话失败：' + err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        textAlign: 'center', 
        py: isMobile ? 4 : 8,
        px: isMobile ? 2 : 0
      }}>
        <CircularProgress size={isMobile ? 40 : 60} />
        <Typography 
          variant={isMobile ? "subtitle1" : "h6"} 
          sx={{ 
            mt: 2,
            fontSize: isMobile ? '1.1rem' : '1.25rem'
          }}
        >
          加载对话记录中...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 页面标题 */}
      <Box sx={{ 
        mb: isMobile ? 3 : 4,
        textAlign: isMobile ? 'center' : 'left',
        px: isMobile ? 1 : 0
      }}>
        <Typography variant={isMobile ? "h4" : "h3"} component="h1" gutterBottom>
          对话记录
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
        >
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
      <Card sx={{ mb: isMobile ? 2 : 3 }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 2 : 2} alignItems="center">
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="搜索对话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size={isMobile ? "medium" : "medium"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                    </InputAdornment>
                  ),
                  // sx: { borderRadius: 0 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>分类筛选</InputLabel>
                <Select
                  value={categoryFilter}
                  label="分类筛选"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  size={isMobile ? "medium" : "medium"}
                  // sx={{ borderRadius: 0 }}
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
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>排序方式</InputLabel>
                <Select
                  value={sortBy}
                  label="排序方式"
                  onChange={(e) => setSortBy(e.target.value)}
                  size={isMobile ? "medium" : "medium"}
                  // sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="date_desc">最新创建</MenuItem>
                  <MenuItem value="date_asc">最早创建</MenuItem>
                  <MenuItem value="messages_desc">消息最多</MenuItem>
                  <MenuItem value="messages_asc">消息最少</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'center' : 'center', 
            mt: 2,
            gap: isMobile ? 1 : 0,
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              共 {conversationsData?.total || 0} 条记录，当前显示第 {conversationsData?.conversations.length ? (currentPage - 1) * itemsPerPage + 1 : 0}-{conversationsData?.conversations.length ? Math.min(currentPage * itemsPerPage, conversationsData.total) : 0} 条
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
            >
              第 {currentPage} 页，共 {conversationsData?.total_pages || 0} 页
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 分页组件 */}
      {conversationsData && conversationsData.total > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: isMobile ? 3 : 4, 
          mb: isMobile ? 3 : 4,
          px: isMobile ? 1 : 0
        }}>
          <Pagination
            count={conversationsData.total_pages}
            page={currentPage}
            onChange={(event, value) => setCurrentPage(value)}
            color="primary"
            size={isMobile ? "medium" : "large"}
            showFirstButton={!isMobile}
            showLastButton={!isMobile}
            siblingCount={isMobile ? 0 : 1}
            boundaryCount={isMobile ? 1 : 1}
          />
        </Box>
      )}

      {/* 对话列表 */}
      {!conversationsData || conversationsData.conversations.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: isMobile ? 4 : 8,
          px: isMobile ? 2 : 0
        }}>
          <Psychology sx={{ 
            fontSize: isMobile ? 60 : 80, 
            color: 'text.secondary', 
            mb: 2 
          }} />
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            gutterBottom 
            color="text.secondary"
          >
            {searchTerm || categoryFilter !== 'all' ? '没有找到匹配的对话' : '还没有对话记录'}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 4,
              fontSize: isMobile ? '0.875rem' : '1rem',
              px: isMobile ? 1 : 0
            }}
          >
            {searchTerm || categoryFilter !== 'all' ? 
              '尝试调整搜索条件或筛选器' : 
              '开始与你的数字人格对话，创建第一条记录吧'
            }
          </Typography>
          {!searchTerm && categoryFilter === 'all' && (
            <Button
              variant="contained"
              onClick={() => navigate('/personas')}
              size={isMobile ? "medium" : "large"}
              fullWidth={isMobile}
              sx={{
                // borderRadius: 0,
                maxWidth: isMobile ? '280px' : 'auto',
                height: isMobile ? '48px' : 'auto'
              }}
            >
              创建对话
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={isMobile ? 2 : 3}>
          {conversationsData.conversations.map((conversation) => (
            <Grid item xs={12} key={conversation.id}>
              <Card
                sx={{
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  // borderRadius: 0,
                  '&:hover': {
                    transform: isMobile ? 'none' : 'translateY(-2px)',
                    boxShadow: isMobile ? 2 : 4,
                  },
                }}
              >
                <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 2 : 0,
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'stretch' : 'flex-start'
                  }}>
                    <Box sx={{ flexGrow: 1 }}>
                      {/* 对话标题和场景 */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: isMobile ? 1.5 : 1,
                        flexDirection: isMobile ? 'column' : 'row',
                        textAlign: isMobile ? 'center' : 'left'
                      }}>
                        <Avatar sx={{ 
                          bgcolor: 'primary.main', 
                          mr: isMobile ? 0 : 2,
                          mb: isMobile ? 1 : 0,
                          width: isMobile ? 48 : 40,
                          height: isMobile ? 48 : 40
                        }}>
                          <Psychology sx={{ fontSize: isMobile ? '1.5rem' : '1.25rem' }} />
                        </Avatar>
                        <Box>
                          <Typography 
                            variant={isMobile ? "subtitle1" : "h6"} 
                            component="h3"
                            sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}
                          >
                            {conversation.title || conversation.scenario.name}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: isMobile ? 0.5 : 1, 
                            mt: 0.5,
                            justifyContent: isMobile ? 'center' : 'flex-start',
                            flexWrap: 'wrap'
                          }}>
                            <Chip
                              label={conversation.scenario.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{
                                height: isMobile ? '24px' : '32px',
                                fontSize: isMobile ? '0.7rem' : '0.8125rem',
                                // borderRadius: 0
                              }}
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
                              sx={{
                                height: isMobile ? '24px' : '32px',
                                fontSize: isMobile ? '0.7rem' : '0.8125rem',
                                // borderRadius: 0
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>

                      {/* 场景描述 */}
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: isMobile ? 1.5 : 2,
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          lineHeight: 1.4
                        }}
                      >
                        {conversation.scenario.description}
                      </Typography>

                      {/* 最后消息 */}
                      {conversation.last_message && (
                        <Box sx={{ 
                          mb: isMobile ? 1.5 : 2, 
                          p: isMobile ? 1 : 1.5, 
                          bgcolor: 'grey.50', 
                          // borderRadius: 0
                        }}>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                          >
                            最后消息：
                          </Typography>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              fontSize: isMobile ? '0.875rem' : '1rem',
                              lineHeight: 1.4
                            }}
                          >
                            {conversation.last_message}
                          </Typography>
                        </Box>
                      )}

                      {/* 统计信息 */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: isMobile ? 1 : 2, 
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        justifyContent: isMobile ? 'center' : 'flex-start'
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chat 
                            fontSize="small" 
                            color="action" 
                            sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            {conversation.message_count || 0} 条消息
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Schedule 
                            fontSize="small" 
                            color="action"
                            sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            {conversation.duration}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday 
                            fontSize="small" 
                            color="action"
                            sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }}
                          />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            {formatDate(conversation.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* 操作按钮 */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      justifyContent: isMobile ? 'center' : 'flex-start',
                      width: isMobile ? '100%' : 'auto'
                    }}>
                      <Button
                        variant="contained"
                        startIcon={<Chat sx={{ fontSize: isMobile ? '1rem' : '1.25rem' }} />}
                        onClick={() => handleContinueChat(conversation)}
                        size={isMobile ? "medium" : "large"}
                        fullWidth={isMobile}
                        sx={{ 
                          // borderRadius: 0,
                          fontSize: isMobile ? '0.875rem' : '1rem',
                          height: isMobile ? '40px' : '48px'
                        }}
                      >
                        继续对话
                      </Button>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, conversation)}
                        size={isMobile ? "medium" : "large"}
                        // sx={{ borderRadius: 0 }}
                      >
                        <MoreVert sx={{ fontSize: isMobile ? '1.25rem' : '1.5rem' }} />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 分页组件 */}
      {conversationsData && conversationsData.total > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mt: isMobile ? 3 : 4,
          px: isMobile ? 1 : 0
        }}>
          <Pagination
            count={conversationsData.total_pages}
            page={currentPage}
            onChange={(event, value) => setCurrentPage(value)}
            color="primary"
            size={isMobile ? "medium" : "large"}
            showFirstButton={!isMobile}
            showLastButton={!isMobile}
            siblingCount={isMobile ? 0 : 1}
            boundaryCount={isMobile ? 1 : 1}
          />
        </Box>
      )}

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{
          '& .MuiPaper-root': {
            // borderRadius: 0,
            minWidth: isMobile ? 160 : 180,
          }
        }}
      >
        <MenuItem 
          onClick={() => handlePreviewConversation(menuConversation!)}
          sx={{ 
            fontSize: isMobile ? '0.875rem' : '1rem',
            py: isMobile ? 1.5 : 1
          }}
        >
          <Visibility sx={{ 
            mr: 1,
            fontSize: isMobile ? '1.25rem' : '1.5rem'
          }} />
          预览对话
        </MenuItem>
        <MenuItem 
          onClick={() => handleDeleteConversation(menuConversation!)}
          sx={{ 
            fontSize: isMobile ? '0.875rem' : '1rem',
            py: isMobile ? 1.5 : 1
          }}
        >
          <Delete sx={{ 
            mr: 1,
            fontSize: isMobile ? '1.25rem' : '1.5rem'
          }} />
          删除对话
        </MenuItem>
      </Menu>

      {/* 对话预览对话框 */}
      <Dialog
        open={previewDialog}
        onClose={() => setPreviewDialog(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        scroll="paper"
      >
        <DialogTitle sx={{ pb: isMobile ? 1 : 2 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"}>
            对话预览
          </Typography>
          {selectedConversation && (
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}
            >
              {selectedConversation.scenario.name} - {formatDate(selectedConversation.created_at)}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers sx={{ px: isMobile ? 2 : 3 }}>
          <Box sx={{ 
            maxHeight: isMobile ? 'none' : 400, 
            overflow: 'auto'
          }}>
            {previewMessages.map((message, index) => (
              <ListItem key={message.id} sx={{ px: 0, py: isMobile ? 1.5 : 1 }}>
                <ListItemAvatar>
                  <Avatar sx={{ 
                    bgcolor: message.sender_type === 'user' ? 'primary.main' : 'secondary.main',
                    width: isMobile ? 32 : 40,
                    height: isMobile ? 32 : 40
                  }}>
                    {message.sender_type === 'user' ? '👤' : '🤖'}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={message.content}
                  secondary={formatDate(message.created_at)}
                  primaryTypographyProps={{
                    fontSize: isMobile ? '0.875rem' : '1rem',
                    lineHeight: 1.4
                  }}
                  secondaryTypographyProps={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem'
                  }}
                />
              </ListItem>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          gap: isMobile ? 1 : 0,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Button 
            onClick={() => setPreviewDialog(false)}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              order: isMobile ? 2 : 1
            }}
          >
            关闭
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewDialog(false);
              if (selectedConversation) {
                handleContinueChat(selectedConversation);
              }
            }}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              order: isMobile ? 1 : 2
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
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: isMobile ? 1 : 2 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"}>
            确认删除
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: isMobile ? 2 : 3 }}>
          <Typography sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            确定要删除这个对话记录吗？此操作无法恢复。
          </Typography>
          {selectedConversation && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                fontSize: isMobile ? '0.75rem' : '0.875rem'
              }}
            >
              对话：{selectedConversation.title || selectedConversation.scenario.name}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: isMobile ? 2 : 1,
          gap: isMobile ? 1 : 0,
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Button 
            onClick={() => setDeleteDialog(false)}
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              order: isMobile ? 2 : 1
            }}
          >
            取消
          </Button>
          <Button
            onClick={confirmDeleteConversation}
            color="error"
            variant="contained"
            fullWidth={isMobile}
            size={isMobile ? "large" : "medium"}
            sx={{ 
              // borderRadius: 0,
              order: isMobile ? 1 : 2
            }}
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConversationHistory; 