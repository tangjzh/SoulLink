import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Fade,
  Stepper,
  Step,
  StepLabel,
  Grid,
  TextField,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { Psychology, CheckCircle, ArrowForward, ArrowBack } from '@mui/icons-material';
import {
  getPersonalityQuestion,
  submitPersonalityAnswer,
  getDigitalPersonas,
  DigitalPersona,
} from '../services/api';

interface PersonalityQuestion {
  question_id: string;
  scenario: string;
  question: string;
  options: string[];
  current_round: number;
  total_estimated_rounds: number;
}

interface Scenario {
  id: string;
  name: string;
  description: string;
  context: string;
}

interface PersonalityAnswer {
  question_id: string;
  selected_option: string;
  option_index: number;
}

const PersonalityAssessment: React.FC = () => {
  const { personaId } = useParams<{ personaId: string }>();
  const navigate = useNavigate();

  // 状态管理
  const [persona, setPersona] = useState<DigitalPersona | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PersonalityQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<PersonalityAnswer[]>([]);
  
  // 场景选择相关状态
  const [scenarioSelected, setScenarioSelected] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [customScenario, setCustomScenario] = useState('');
  const [showCustomScenario, setShowCustomScenario] = useState(false);

  // 预定义场景
  const predefinedScenarios: Scenario[] = [
    {
      id: 'workplace',
      name: '🏢 职场环境',
      description: '在你当前的工作场所',
      context: '你在一个中等规模的公司工作，有着相对稳定的工作环境和同事关系。公司文化比较开放，鼓励员工表达想法和创新。'
    },
    {
      id: 'social_gathering',
      name: '🎉 社交聚会',
      description: '朋友聚会或社交活动中',
      context: '你参加了一个朋友组织的聚会，现场有你认识的朋友，也有一些初次见面的人。气氛轻松愉快，大家都在随意交流。'
    },
    {
      id: 'family_time',
      name: '🏠 家庭时光',
      description: '与家人相处的时间',
      context: '你和家人在一起度过休闲时光，可能是周末的下午或节假日。家里气氛温馨，大家都比较放松。'
    },
    {
      id: 'travel_adventure',
      name: '✈️ 旅行途中',
      description: '在旅行或探索新环境时',
      context: '你正在一个陌生的城市或地方旅行，需要做各种决定和应对不同的情况。这是一次相对自由的个人旅行。'
    },
    {
      id: 'crisis_situation',
      name: '🚨 挑战时刻',
      description: '面临压力或挑战的情况',
      context: '你正面临一个需要重要决策的关键时刻，可能是工作上的紧急情况，或是生活中需要快速应对的挑战。'
    },
    {
      id: 'learning_growth',
      name: '📚 学习成长',
      description: '学习新技能或知识的环境',
      context: '你正在学习一项新的技能或知识，可能是参加课程、工作坊，或是自主学习。你对这个领域还比较陌生但很感兴趣。'
    }
  ];

  // 加载数字人格信息
  useEffect(() => {
    const loadPersona = async () => {
      if (!personaId) return;
      
      try {
        const personas = await getDigitalPersonas();
        const targetPersona = personas.find(p => p.id === personaId);
        if (targetPersona) {
          setPersona(targetPersona);
        } else {
          setError('数字人格不存在');
        }
      } catch (err: any) {
        setError('加载数字人格失败：' + err.message);
      }
    };

    loadPersona();
  }, [personaId]);

  // 加载第一个问题
  useEffect(() => {
    if (persona && !currentQuestion && !completed && scenarioSelected && selectedScenario) {
      loadNextQuestion();
    }
  }, [persona, scenarioSelected, selectedScenario]);

  const loadNextQuestion = async () => {
    if (!personaId || !selectedScenario) return;

    setLoading(true);
    setError('');
    setSelectedOption(null);

    try {
      const question = await getPersonalityQuestion(personaId, answers, selectedScenario);
      
      if (question.completed) {
        setCompleted(true);
      } else {
        setCurrentQuestion(question);
      }
    } catch (err: any) {
      setError('加载问题失败：' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion || selectedOption === null || !personaId) return;

    setSubmitting(true);
    setError('');

    try {
      const answer: PersonalityAnswer = {
        question_id: currentQuestion.question_id,
        selected_option: currentQuestion.options[selectedOption],
        option_index: selectedOption,
      };

      // 提交答案并获取优化结果
      const result = await submitPersonalityAnswer(personaId, answer);
      
      // 保存答案到历史记录
      setAnswers(prev => [...prev, answer]);

      if (result.completed) {
        setCompleted(true);
      } else {
        // 加载下一个问题
        setTimeout(() => {
          loadNextQuestion();
        }, 1000);
      }

    } catch (err: any) {
      setError('提交答案失败：' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = () => {
    navigate(`/chat/${personaId}`);
  };

  // 场景选择处理函数
  const handleScenarioSelect = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setScenarioSelected(true);
  };

  const handleCustomScenarioSubmit = () => {
    if (customScenario.trim()) {
      const custom: Scenario = {
        id: 'custom',
        name: '🎯 自定义场景',
        description: '你自己设定的场景',
        context: customScenario.trim()
      };
      setSelectedScenario(custom);
      setScenarioSelected(true);
    }
  };

  const handleBackToScenarioSelection = () => {
    setScenarioSelected(false);
    setSelectedScenario(null);
    setCurrentQuestion(null);
    setAnswers([]);
    setCompleted(false);
  };

  const getProgress = () => {
    if (!currentQuestion) return 0;
    return Math.min((currentQuestion.current_round / currentQuestion.total_estimated_rounds) * 100, 100);
  };

  if (error && !persona) {
    return (
      <Box textAlign="center" sx={{ py: 8 }}>
        <Alert severity="error" sx={{ maxWidth: 400, mx: 'auto' }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/personas')} 
          sx={{ mt: 2 }}
        >
          返回数字人格列表
        </Button>
      </Box>
    );
  }

  if (completed) {
    return (
      <Fade in={true}>
        <Box textAlign="center" sx={{ py: 8 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            🎉 人格测评完成！
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            你的数字分身已经更加了解你了
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
            基于你的 {answers.length} 个回答，AI已经优化了数字人格的特征，现在它能更好地代表你的个性和行为模式。
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/personas')}
            sx={{ px: 4, py: 1.5, mr: 2 }}
          >
            返回数字人格列表
          </Button>

          <Button 
            variant="contained" 
            size="large"
            startIcon={<ArrowForward />}
            onClick={handleComplete}
            sx={{ px: 4, py: 1.5, ml: 2 }}
          >
            开始与数字分身对话
          </Button>
        </Box>
      </Fade>
    );
  }

  // 场景选择界面
  if (!scenarioSelected) {
    return (
      <Box sx={{ maxWidth: 900, mx: 'auto', py: 4 }}>
        {/* 头部信息 */}
        <Box textAlign="center" sx={{ mb: 4 }}>
          <Psychology sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            智能人格测评
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {persona?.name} 的个性化评估
          </Typography>
          <Typography variant="body1" color="text.secondary">
            请选择一个测评场景，所有问题将在这个固定场景下进行
          </Typography>
        </Box>

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 场景选择 */}
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          选择测评场景
        </Typography>

        <Grid container spacing={3}>
          {predefinedScenarios.map((scenario) => (
            <Grid item xs={12} md={6} key={scenario.id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleScenarioSelect(scenario)}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {scenario.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {scenario.description}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    bgcolor: 'grey.100', 
                    p: 2, 
                    borderRadius: 1,
                    fontSize: '0.85rem'
                  }}>
                    {scenario.context}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 自定义场景 */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            或者自定义场景
          </Typography>
          
          {!showCustomScenario ? (
            <Button
              variant="outlined"
              onClick={() => setShowCustomScenario(true)}
              sx={{ mb: 2 }}
            >
              创建自定义场景
            </Button>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                描述你想要的测评场景
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={customScenario}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCustomScenario(e.target.value)}
                placeholder="例如：你在一个创业公司担任产品经理，公司正处于快速发展期，团队氛围活跃但工作压力较大..."
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  onClick={handleCustomScenarioSubmit}
                  disabled={!customScenario.trim()}
                >
                  开始测评
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setShowCustomScenario(false);
                    setCustomScenario('');
                  }}
                >
                  取消
                </Button>
              </Box>
            </Paper>
          )}
        </Box>

        {/* 底部提示 */}
        <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            💡 所选场景将作为整个测评的背景，所有问题都将在这个场景下展开，这样能更准确地评估你在特定环境中的行为模式
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      {/* 头部信息 */}
      <Box textAlign="center" sx={{ mb: 4 }}>
        <Psychology sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          智能人格测评
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {persona?.name} 的个性化评估
        </Typography>
        
        {/* 显示选中的场景 */}
        {selectedScenario && (
          <Paper sx={{ p: 2, mt: 2, bgcolor: 'primary.light' }}>
            <Typography variant="subtitle1" sx={{ color: 'primary.contrastText', mb: 1 }}>
              测评场景：{selectedScenario.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'primary.contrastText' }}>
              {selectedScenario.context}
            </Typography>
            <Button
              size="small"
              onClick={handleBackToScenarioSelection}
              sx={{ mt: 1, color: 'primary.contrastText' }}
            >
              重新选择场景
            </Button>
          </Paper>
        )}
      </Box>

      {/* 进度条 */}
      {currentQuestion && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              测评进度
            </Typography>
            <Chip 
              label={`第 ${currentQuestion.current_round} / ${currentQuestion.total_estimated_rounds} 题`}
              color="primary"
              size="small"
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={getProgress()} 
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {getProgress().toFixed(0)}% 完成
          </Typography>
        </Paper>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 问题卡片 */}
      {loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            正在生成个性化问题...
          </Typography>
        </Paper>
      ) : currentQuestion ? (
        <Fade in={true} key={currentQuestion.question_id}>
          <Paper sx={{ p: 4 }}>
            {/* 情景描述 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                📖 情景设定
              </Typography>
              <Typography variant="body1" sx={{ 
                bgcolor: 'primary.light', 
                p: 2, 
                borderRadius: 1,
                color: 'primary.contrastText'
              }}>
                {currentQuestion.scenario}
              </Typography>
            </Box>

            {/* 问题 */}
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              {currentQuestion.question}
            </Typography>

            {/* 选项 */}
            <Box sx={{ mb: 4 }}>
              {currentQuestion.options.map((option, index) => (
                <Card 
                  key={index}
                  sx={{ 
                    mb: 2, 
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: selectedOption === index ? 'primary.main' : 'transparent',
                    bgcolor: selectedOption === index ? 'primary.light' : 'background.paper',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 2
                    }
                  }}
                  onClick={() => handleOptionSelect(index)}
                >
                  <CardContent sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: selectedOption === index ? 'primary.main' : 'grey.400',
                          bgcolor: selectedOption === index ? 'primary.main' : 'transparent',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {selectedOption === index && (
                          <CheckCircle sx={{ fontSize: 16, color: 'white' }} />
                        )}
                      </Box>
                      <Typography variant="body1">
                        {option}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* 提交按钮 */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null || submitting}
                sx={{ px: 4, py: 1.5 }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    处理中...
                  </>
                ) : (
                  '确认选择'
                )}
              </Button>
            </Box>
          </Paper>
        </Fade>
      ) : null}

      {/* 底部提示 */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          💡 每个问题都会帮助AI更好地理解你的个性特征，请根据真实想法选择最符合你的选项
        </Typography>
      </Paper>
    </Box>
  );
};

export default PersonalityAssessment; 