const Check = require('../models/Check'); // ← ESSA LINHA ESTAVA FALTANDO
 
const getHistory = async (req, res) => {

  try {

    const page = parseInt(req.query.page) || 1;

    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
 
    const checks = await Check.find({ userId: req.user._id })

      .sort({ createdAt: -1 })

      .skip(skip)

      .limit(limit)

      .select('-articleContent');
 
    const total = await Check.countDocuments({ userId: req.user._id });
 
    res.json({

      success: true,

      checks,

      pagination: {

        page,

        limit,

        total,

        pages: Math.ceil(total / limit)

      }

    });
 
  } catch (error) {

    res.status(500).json({ error: 'Erro ao buscar histórico.' });

  }

};
 
const deleteCheck = async (req, res) => {

  try {

    const check = await Check.findOne({

      _id: req.params.id,

      userId: req.user._id

    });
 
    if (!check) {

      return res.status(404).json({ error: 'Verificação não encontrada.' });

    }
 
    await check.deleteOne();

    res.json({ success: true, message: 'Removido do histórico.' });
 
  } catch (error) {

    res.status(500).json({ error: 'Erro ao deletar.' });

  }

};
 
module.exports = { getHistory, deleteCheck }; // ← ESSA LINHA É OBRIGATÓRIA
 