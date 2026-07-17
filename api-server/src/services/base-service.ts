/**
 * Interface unifiée de résultat de service (inspiré de SkillResult dans agentic-builder).
 */
export interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Contrat de base pour un service autonome (inspiré de BaseSkill dans agentic-builder).
 */
export interface IService<TInput, TOutput> {
  readonly name: string;
  execute(input: TInput): Promise<ServiceResult<TOutput>>;
}
