import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Psychology, Chat, Quiz } from '@mui/icons-material';
import { createDigitalPersona, DigitalPersona } from '../services/api';

const PersonaCreate: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdPersona, setCreatedPersona] = useState<DigitalPersona | null>(null);
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ageRange: '',
    gender: '',
    interests: [] as string[],
    personality: '',
    values: '',
  });

  const [currentInterest, setCurrentInterest] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  // 预设的兴趣爱好候选项
  const candidateInterests = [
    '阅读', '写作', '音乐', '电影', '绘画', '摄影', '旅行', '运动',
    '游戏', '编程', '设计', '烹饪', '美食', '时尚', '瑜伽', '健身',
    '跑步', '游泳', '爬山', '骑行', '篮球', '足球', '羽毛球', '网球',
    '钢琴', '吉他', '唱歌', '舞蹈', '话剧', '相声', '动漫', '漫画',
    '科技', '数码', '投资', '理财', '创业', '心理学', '哲学', '历史',
    '语言', '宠物', '花草', '收藏', '手工', '咖啡', '茶道', '红酒'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 切换候选项的选中状态
  const handleCandidateToggle = (interest: string) => {
    setSelectedCandidates(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  // 将选中的候选项添加到已选兴趣中
  const handleAddSelectedCandidates = () => {
    if (selectedCandidates.length === 0) return;

    const newInterests = selectedCandidates.filter(
      interest => !formData.interests.includes(interest)
    );

    if (newInterests.length > 0) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, ...newInterests]
      }));
    }

    setSelectedCandidates([]);
  };

  // 添加自定义兴趣
  const handleAddCustomInterest = () => {
    if (currentInterest.trim() && !formData.interests.includes(currentInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, currentInterest.trim()]
      }));
      setCurrentInterest('');
    }
  };

  // 移除已选兴趣
  const handleRemoveInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  // 选择直接对话
  const handleChooseChat = () => {
    if (createdPersona) {
      navigate(`/chat/${createdPersona.id}`);
    }
  };

  // 选择量表评估
  const handleChooseAssessment = () => {
    if (createdPersona) {
      navigate(`/personality-assessment/${createdPersona.id}`);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('请输入数字人格名称');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const basicInfo = {
        username: formData.name,
        age_range: formData.ageRange,
        gender: formData.gender,
        interests: formData.interests.join(', '),
        // personality: formData.personality,
        // values: formData.values,
      };

      const persona = await createDigitalPersona({
        name: formData.name,
        description: formData.description,
        basic_info: basicInfo,
      });

      setCreatedPersona(persona);
      setSuccess(true);
      setChoiceDialogOpen(true);

    } catch (err: any) {
      setError(err.message || '创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (success && !choiceDialogOpen) {
    return (
      <Box textAlign="center" sx={{ py: 8 }}>
        <Psychology sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          数字人格创建成功！
        </Typography>
        <Typography variant="body1" color="text.secondary">
          请选择下一步操作...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom textAlign="center">
        创建你的数字人格
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
        提供一些基本信息，AI将为你生成专属的数字人格
      </Typography>

      <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* 基本信息 */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              基本信息
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="数字人格名称"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="例如：小AI、我的数字分身"
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>年龄范围</InputLabel>
              <Select
                value={formData.ageRange}
                label="年龄范围"
                onChange={(e) => handleInputChange('ageRange', e.target.value)}
              >
                <MenuItem value="18-25">18-25岁</MenuItem>
                <MenuItem value="26-30">26-30岁</MenuItem>
                <MenuItem value="31-35">31-35岁</MenuItem>
                <MenuItem value="36-40">36-40岁</MenuItem>
                <MenuItem value="40+">40岁以上</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>性别</InputLabel>
              <Select
                value={formData.gender}
                label="性别"
                onChange={(e) => handleInputChange('gender', e.target.value)}
              >
                <MenuItem value="male">男性</MenuItem>
                <MenuItem value="female">女性</MenuItem>
                <MenuItem value="other">其他</MenuItem>
                <MenuItem value="prefer_not_to_say">不愿透露</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="简短描述"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="简单描述一下你希望这个数字人格是什么样的"
              multiline
              rows={2}
            />
          </Grid>

          {/* 兴趣爱好 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              兴趣爱好
            </Typography>
          </Grid>

          {/* 候选兴趣爱好 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, fontWeight: 500 }}>
              从以下选项中选择：
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              mb: 2,
              maxHeight: 200,
              overflowY: 'auto',
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'grey.50'
            }}>
              {candidateInterests.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  onClick={() => handleCandidateToggle(interest)}
                  color={selectedCandidates.includes(interest) ? "primary" : "default"}
                  variant={selectedCandidates.includes(interest) ? "filled" : "outlined"}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: selectedCandidates.includes(interest) ? 'primary.dark' : 'grey.200'
                    }
                  }}
                  disabled={formData.interests.includes(interest)}
                />
              ))}
            </Box>
            
            {/* 添加选中的候选项按钮 */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                onClick={handleAddSelectedCandidates}
                disabled={selectedCandidates.length === 0}
                sx={{ minWidth: 120 }}
              >
                添加选中项 ({selectedCandidates.length})
              </Button>
            </Box>
          </Grid>

          {/* 自定义兴趣爱好 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
              或添加其他兴趣：
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="自定义兴趣爱好"
                value={currentInterest}
                onChange={(e) => setCurrentInterest(e.target.value)}
                placeholder="例如：天文观测、古典文学"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomInterest();
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddCustomInterest}
                sx={{ minWidth: 100 }}
                disabled={!currentInterest.trim() || formData.interests.includes(currentInterest.trim())}
              >
                添加
              </Button>
            </Box>
          </Grid>

          {/* 已选择的兴趣爱好 */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
              已选择的兴趣爱好：
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1,
              minHeight: 60,
              p: 2,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: formData.interests.length > 0 ? 'primary.light' : 'grey.100'
            }}>
              {formData.interests.length > 0 ? (
                formData.interests.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  onDelete={() => handleRemoveInterest(interest)}
                  color="primary"
                    variant="filled"
                />
                ))
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  暂未选择任何兴趣爱好
                </Typography>
              )}
            </Box>
          </Grid>

          {/* 性格特征 */}
          {/* <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              性格特征
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="性格描述"
              value={formData.personality}
              onChange={(e) => handleInputChange('personality', e.target.value)}
              placeholder="描述你的性格特点，例如：外向开朗、理性思考、富有同情心..."
              multiline
              rows={3}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="价值观念"
              value={formData.values}
              onChange={(e) => handleInputChange('values', e.target.value)}
              placeholder="描述你重视的价值观，例如：诚实守信、追求自由、重视家庭..."
              multiline
              rows={3}
            />
          </Grid> */}

          {/* 提交按钮 */}
          <Grid item xs={12} sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={loading}
              sx={{ px: 6, py: 1.5 }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  创建中...
                </>
              ) : (
                '创建数字人格'
              )}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 提示信息 */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h6" gutterBottom>
          💡 小贴士
        </Typography>
        <Typography variant="body2">
          • 提供的信息越详细，AI生成的数字人格就越准确<br/>
          • 创建后可以通过对话和反馈进一步优化人格特征<br/>
          • 支持创建多个不同的数字人格来探索不同的个性面向
        </Typography>
      </Paper>

      {/* 选择下一步操作的对话框 */}
      <Dialog
        open={choiceDialogOpen}
        onClose={() => {}} // 禁止点击外部关闭
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Psychology sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" component="div">
            🎉 数字人格创建成功！
          </Typography>
          <Typography variant="body2" color="text.secondary">
            选择你想要的个性化方式
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 2
                  }
                }}
                onClick={handleChooseChat}
              >
                <Chat sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  直接开始对话
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  通过自由对话让数字分身更了解你的说话风格和想法
                </Typography>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  sx={{ mt: 2 }}
                  onClick={handleChooseChat}
                >
                  开始对话
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  border: '2px solid transparent',
                  '&:hover': {
                    borderColor: 'secondary.main',
                    boxShadow: 2
                  }
                }}
                onClick={handleChooseAssessment}
              >
                <Quiz sx={{ fontSize: 48, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  智能人格测评
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  通过AI生成的情景化问题深入了解你的人格特征和行为模式
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth 
                  color="secondary"
                  sx={{ mt: 2 }}
                  onClick={handleChooseAssessment}
                >
                  开始测评
                </Button>
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              💡 建议：人格测评能够更精准地捕捉你的个性特征，让数字分身更像真实的你
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PersonaCreate; 