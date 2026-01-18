from enum import Enum
from typing import List, Dict, Optional, Set
import dataclasses

class Religion(Enum):
    CHRISTIANITY = "christianity"
    ISLAM = "islam"
    BUDDHISM = "buddhism"
    HINDUISM = "hinduism"
    JUDAISM = "judaism"
    SHINTO = "shinto"
    SECULAR = "secular"
    OTHER = "other"  # カスタム入力用

@dataclasses.dataclass
class ReligiousContext:
    religion: Religion
    specific_denomination: Optional[str]  # より詳細な宗派
    religious_sensitivity: float  # 0-1: 宗教的な考慮の重要度
    taboos: Set[str]  # 避けるべき概念
    preferred_concepts: Set[str]  # 好ましい概念

@dataclasses.dataclass
class KanjiMetadata:
    character: str
    meanings: List[str]
    readings_on: List[str]
    readings_kun: List[str]
    stroke_count: int
    sentiment_score: float  # 0-1
    energy_level: float  # 0-1
    associations: List[str]
    cultural_notes: str
    religious_associations: Dict[Religion, float]  # 各宗教との親和性
    religious_concepts: List[str]  # 関連する宗教的概念
    taboo_concepts: List[str]  # 注意が必要な概念

@dataclasses.dataclass
class PersonalityProfile:
    primary_traits: List[str]
    aspirations: List[str]
    interests: List[str]
    cultural_background: str
    preferred_style: str
    religious_context: ReligiousContext

class ReligiousCompatibilityChecker:
    def __init__(self):
        self.religion_specific_rules = {
            Religion.ISLAM: {
                "prohibited_concepts": {"酒", "豚", "賭"},  # 酒、豚、賭博など
                "preferred_concepts": {"光", "善", "真", "正", "信"},  # 光明、善良、真実、正義、信仰など
                "sensitivity_level": 0.9
            },
            Religion.CHRISTIANITY: {
                "prohibited_concepts": {"魔", "邪", "悪"},  # 魔術、邪気、悪など
                "preferred_concepts": {"愛", "光", "恵", "祈", "信"},  # 愛、光、恵み、祈り、信仰など
                "sensitivity_level": 0.7
            },
            Religion.BUDDHISM: {
                "prohibited_concepts": {"殺", "痛"},  # 殺生、苦痛など
                "preferred_concepts": {"慈", "悟", "智", "道", "禅"},  # 慈悲、悟り、智慧、道、禅など
                "sensitivity_level": 0.6
            },
            # 他の宗教も同様に定義...
        }

    def check_compatibility(self, kanji: KanjiMetadata, context: ReligiousContext) -> float:
        """漢字と宗教的文脈との互換性をチェック"""
        if context.religion == Religion.SECULAR:
            return 1.0

        rules = self.religion_specific_rules.get(context.religion)
        if not rules:
            return 0.8  # デフォルトの互換性スコア

        score = 1.0

        # 禁忌概念のチェック
        for concept in kanji.taboo_concepts:
            if concept in rules["prohibited_concepts"]:
                return 0.0  # 完全に不適合

        # 好ましい概念との一致度
        preferred_matches = sum(
            1 for concept in kanji.religious_concepts 
            if concept in rules["preferred_concepts"]
        )
        score += (preferred_matches * 0.2)

        # 宗教との親和性スコア
        religious_affinity = kanji.religious_associations.get(context.religion, 0.0)
        score += (religious_affinity * rules["sensitivity_level"])

        return min(score, 1.0)

class KanjiNameGenerator:
    def __init__(self):
        self.kanji_database = self._initialize_database()
        self.religious_checker = ReligiousCompatibilityChecker()

    def _initialize_database(self) -> Dict[str, KanjiMetadata]:
        """宗教的な考慮を含むデータベースの初期化"""
        return {
            "光": KanjiMetadata(
                character="光",
                meanings=["light", "shine", "brilliant"],
                readings_on=["コウ"],
                readings_kun=["ひかり"],
                stroke_count=6,
                sentiment_score=0.9,
                energy_level=0.8,
                associations=["brilliance", "future", "hope"],
                cultural_notes="Universal symbol of wisdom and guidance",
                religious_associations={
                    Religion.CHRISTIANITY: 0.9,  # "I am the light"との関連
                    Religion.ISLAM: 0.9,  # Nurの概念との関連
                    Religion.BUDDHISM: 0.8,  # 仏の光との関連
                    Religion.HINDUISM: 0.8,
                    Religion.JUDAISM: 0.9,
                    Religion.SHINTO: 0.7
                },
                religious_concepts=["divine light", "wisdom", "guidance"],
                taboo_concepts=[]
            ),
            "信": KanjiMetadata(
                character="信",
                meanings=["faith", "truth", "trust"],
                readings_on=["シン"],
                readings_kun=["まこと"],
                stroke_count=9,
                sentiment_score=0.8,
                energy_level=0.6,
                associations=["faith", "trust", "reliability"],
                cultural_notes="Represents spiritual and interpersonal trust",
                religious_associations={
                    Religion.CHRISTIANITY: 0.9,
                    Religion.ISLAM: 0.9,
                    Religion.BUDDHISM: 0.8,
                    Religion.HINDUISM: 0.8,
                    Religion.JUDAISM: 0.9,
                    Religion.SHINTO: 0.8
                },
                religious_concepts=["faith", "belief", "devotion"],
                taboo_concepts=[]
            ),
            # より多くの漢字データ...
        }

    def generate_name(self, original_name: str, profile: PersonalityProfile) -> List[Dict]:
        """宗教的な考慮を含む名前生成"""
        candidates = self._select_candidates(profile)
        combinations = self._generate_combinations(candidates, len(original_name))
        
        scored_combinations = []
        for combo in combinations:
            religious_score = self._calculate_religious_compatibility(
                combo, profile.religious_context
            )
            if religious_score > 0:  # 宗教的に適合する組み合わせのみ
                general_score = self._calculate_general_score(combo, profile)
                total_score = (religious_score + general_score) / 2
                
                explanation = self._generate_explanation(combo, profile)
                scored_combinations.append({
                    "kanji": [k.character for k in combo],
                    "score": total_score,
                    "explanation": explanation,
                    "religious_context": self._generate_religious_context(
                        combo, profile.religious_context
                    )
                })
        
        return sorted(scored_combinations, key=lambda x: x["score"], reverse=True)[:3]

    def _generate_religious_context(self, 
                                  combo: List[KanjiMetadata], 
                                  context: ReligiousContext) -> str:
        """宗教的な文脈の説明を生成"""
        if context.religion == Religion.SECULAR:
            return "This name has been chosen to reflect universal human values."
            
        religious_meanings = []
        for kanji in combo:
            relevant_concepts = [
                concept for concept in kanji.religious_concepts
                if not any(taboo in concept for taboo in context.taboos)
            ]
            if relevant_concepts:
                religious_meanings.append(
                    f"The character {kanji.character} represents {', '.join(relevant_concepts)} "
                    f"in {context.religion.value} tradition."
                )
        
        return " ".join(religious_meanings)
