class classifier:
    def __init__(self, getfeatures, filename=None):
        # fc : feature count
        # 각 특성이 분류항목마다 얼마나 들어있는지 개수를 나타냄
        # 예) {'python' : {'bad' : 0, 'good' : 6}, 'the' : {'bad' : 3, 'good' : 3}}
        # python 단어는 bad로 분류된 문서들에 0번 good으로 분류된 문서들에 6번 나타났다        
        self.fc = {}
        
        # cc : categories count
        # 각 분류항목에 몇 개의 문서가 분류되었는지 개수를 나타냄
        # 예) {'bad' : 3, good' : 4}
        # bad로 분류된 문서가 3개
        self.cc = {}
        
        # 특성 추출 함수
        self.getfeatures = getfeatures
        
        self.usedb = False
    
    def setdb(self, dbfile):
        self.usedb =  True
        self.con = sqlite3.connect(dbfile)
        self.con.execute('create table if not exists fc(feature, category, count)')
        self.con.execute('create table if not exists cc(category, count)')        
    
    # 특성/분류항목 쌍의 개수 증가
    def incf(self, f, cat):
        if self.usedb:
            count = self.fcount(f, cat)

            if count == 0:
                self.con.execute("insert into fc values('%s', '%s', 1)" % (f, cat))
            else:
                self.con.execute("update fc set count = %d where feature = '%s' and category = '%s'" % (count + 1, f, cat))
        else:
            self.fc.setdefault(f, {})
            self.fc[f].setdefault(cat, 0)
            self.fc[f][cat] += 1
        
    # 분류항목의 분류횟수 증가 
    def incc(self, cat):
        if self.usedb: 
            count = self.catcount(cat)
            if count == 0:
                self.con.execute("insert into cc values('%s', 1)" % cat)
            else:
                self.con.execute("update cc set count = %d where category = '%s'" % (count + 1, cat))
        else:
            self.cc.setdefault(cat, 0)
            self.cc[cat] += 1
    
    # 특성/분류항목 쌍의 개수 반환
    def fcount(self, f, cat):        
        if self.usedb:
            res = self.con.execute("select count from fc where feature = '%s' and category = '%s'" % (f, cat)).fetchone()
            if res == None: return 0
            return int(res[0])
        else:
            if f in self.fc and cat in self.fc[f]:
                return self.fc[f][cat]
            return 0
    
    # 분류항목의 분류횟수 반환
    def catcount(self, cat):        
        if self.usedb:
            res = self.con.execute("select count from cc where category = '%s'" % cat).fetchone()
            if res == None: return 0
            return int(res[0])
        else:
            if cat in self.cc:
                return self.cc[cat]
            return 0
    
    # 분류된 문서 전체 개수
    def totalcount(self):        
        if self.usedb:
            res = self.con.execute('select sum(count) from cc').fetchone()
            if res == None: return 0
            return int(res[0])
        else:
            return sum(self.cc.values())
    
    # 전체 분류항목 반환
    def categories(self):        
        if self.usedb:
            cur = self.con.execute('select category from cc')
            return [d[0] for d in cur]
        else:
            return self.cc.keys()
    
    # 정확한 분류를 위해 정답 데이터를 넣어 훈련시킨다(실상은 카운팅)
    # item : 항목(문서)
    # cat : 카테고리(분류항목) -> 정답 데이터
    def train(self, item, cat):
        features = self.getfeatures(item)
        for f in features: self.incf(f, cat)            
        self.incc(cat)
        if self.usedb: self.con.commit()
        
    # 조건부 확률(Conditional probability)
    # P(A|B) : B의 조건이 주어졌을 때, 사건 A가 발생할 확률
    # P(A|B) = P(A∩B) / P(B)    
    # 여기서는 cat으로 분류되었을 때, 단어 f가 나타날 확률
    # [분류 cat에 단어 f가 나타난 항목(문서) 횟수] / [cat으로 분류된 항목(문서) 개수]
    # P(A∩B) = n(A∩B) / n(S), P(B) = n(B) / n(S)
    # P(A|B) = P(A∩B) / P(B) = (n(A∩B) / n(S)) / (n(B) / n(S)) = n(A∩B) / n(S)
    # S는 전체사건, n은 개수
    def fprob(self, f, cat):
        if self.catcount(cat) == 0: return 0
        return self.fcount(f, cat) / self.catcount(cat)
    
    # sampletrain에서 money는 bad에만 포함되어있어, fprob를 호출하면 good에 나타날 확률은 0이 나온다
    # money는 중립적인 단어인데 이는 너무 극단적이다
    # 따라서 가장확률(Assumed probability)를 두어 이 문제를 해결해보자(시작은 0.5)
    # 가장확률을 얼마만큼 반영할지 가중치(Weight)도 둔다(가중치가 1인경우 가장확률을 단어 1개와 동일한 취급)
    def weightedprob(self, f, cat, prf, weight=1.0, ap=0.5):
        basicprob = prf(f, cat)
        totals = sum([self.fcount(f, c) for c in self.categories()]) # 모든 분류에서 이 특성이 나타난 횟수
        bp = (weight*ap + totals*basicprob) / (weight+totals) # 가장확률을 추가하여 확률을 구하는 공식
        return bp

class naivebayes(classifier):
    def __init__(self, getfeatures):
        classifier.__init__(self, getfeatures)
        self.thresholds = {} # 최소 경계값
    
    # 나이브 베이지안 분류기를 사용하기 위해 우선 P(Document | Category) - 특정 카테고리일 때 이 문서일 확률을 구해야 한다
    # 독립을 가정하므로 해당 문서의 모든 단어(특성)에 대해 P(Feature | Category) 확률을 구해 서로 곱하면 구할 수 있다
    # 이 자체로는 유용하지 않다. 우리가 실제로 구하고자 하는 확률은 P(Category | Document) - 특정 문서가 있을 때 어떤 분류항목일 확률
    def docprob(self, item, cat):
        features = self.getfeatures(item)
        
        p = 1
        for f in features:
            p *= self.weightedprob(f, cat, self.fprob)
        
        return p
    
    # 베이즈 정리(Bayes Theorem)는 조건부 확률을 뒤집는 방법이다
    # P(A | B) = P(B | A) * P(A) / P(B)
    # P(Category | Document) = P(Document | Category) * P(Category) / P(Document)
    # P(Category) 는 무작위로 선택된 문서가 이 분류에 속할 확률로 분류 내 문서 건수를 문서 전체 건수로 나눈 값이다
    # P(Document) 는 1 / 전체문서수 이므로 항상 동일한 값이므로 무시하기로 한다
    def prob(self, item, cat):
        catprob = self.catcount(cat) / self.totalcount()
        docprob = self.docprob(item, cat)
        return docprob * catprob
    
    def setthreshold(self, cat, t):
        self.thresholds[cat] = t
        
    def getthreshold(self, cat):
        if cat not in self.thresholds:
            return 1.0
        return self.thresholds[cat]
    
    # prob 함수의 결과 중 가장 높은 확률을 가진 분류를 선택할 수 도 있지만,
    # 예로 스팸 필터의 경우 중요한 메일이 잘못 분류되어 스팸함으로 들어가버리면 안되기 때문에
    # 스팸으로 분류되는 것을 보수적으로 설정할 필요가 있다
    # 최소 경계값(threshold)를 사용하자
    # 만약 어떤 문서가 good일 확률이 가장 높다고 한다면
    # bad의 threshold를 3으로 설정하면, bad일 확률이 3배 높아지고, good일 확률이 이 확률보다 높아야 good으로 분류된다
    # 그렇지 못하면 default 항목으로 분류된다
    def classify(self, item, default=None):
        probs = {}
        maximum = 0.0
        for cat in self.categories():
            probs[cat] = self.prob(item, cat)
            if probs[cat] > maximum:
                maximum = probs[cat]
                best = cat
                
        for cat in probs:
            if cat == best:
                continue
            if probs[cat]*self.getthreshold(best) > probs[best]:
                return default
        
        return best