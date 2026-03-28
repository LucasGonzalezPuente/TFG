SELECT 
    T1.session_id, 
    T1.accuracy, 
    T1.tiempo_total, 
    T2.respuestas 
FROM logs_objetivos AS T1
JOIN encuestas AS T2 ON T1.session_id = T2.session_id;

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